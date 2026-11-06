"use client";
import { useMemo, useState } from "react";
import { CATEGORIAS, paraCsv, resumo, totalLinha, type Categoria, type Linha } from "@/lib/orcamento";
import { LINHAS_PADRAO } from "@/lib/orcamento-padrao";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const lerNum = (s: string) => Number(s.replace(",", "."));

export default function Orcamento() {
  const [linhas, setLinhas] = useState<Linha[]>(LINHAS_PADRAO);
  const [cont, setCont] = useState("0");
  const [filtro, setFiltro] = useState<Categoria | "Todas">("Todas");
  const pct = lerNum(cont);
  const valido = Number.isFinite(pct) && pct >= 0 && pct <= 100;
  const r = useMemo(() => (valido ? resumo(linhas, pct) : null), [linhas, pct, valido]);
  const set = (id: string, campo: Partial<Linha>) => setLinhas(ls => ls.map(l => (l.id === id ? { ...l, ...campo } : l)));

  const csv = () => {
    const blob = new Blob(["\uFEFF" + paraCsv(linhas)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "orcamento-tchutchucos.csv"; a.click(); URL.revokeObjectURL(a.href);
  };
  const novo = () => setLinhas(ls => [...ls, { id: `n${Date.now()}`, categoria: "Pavimentação", servico: "Novo serviço", unidade: "un", quantidade: 0, preco: 0, fonte: "FICTÍCIO — exemplo, não é cotação", data: "—", obs: "" }]);
  const apagar = (l: Linha) => { if (confirm(`Apagar "${l.servico}"?`)) setLinhas(ls => ls.filter(x => x.id !== l.id)); };
  const vis = linhas.filter(l => filtro === "Todas" || l.categoria === filtro);

  return (
    <div>
      <p className="rounded border border-yellow-500/60 p-3 text-sm text-yellow-200">Todos os preços são FICTÍCIOS, só para demonstrar o cálculo. Não são cotações, índices ou composições oficiais. Substitua pelos valores da equipe e registre fonte e data.</p>
      <div className="no-print mt-4 flex flex-wrap items-end gap-3 text-sm">
        <label className="grid gap-1">Categoria
          <select className="rounded bg-gelo p-2 text-marinho" value={filtro} onChange={e => setFiltro(e.target.value as Categoria | "Todas")}>
            <option>Todas</option>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="grid gap-1">Contingência (%) — hipótese
          <input inputMode="decimal" className="w-28 rounded bg-gelo p-2 text-marinho" value={cont} onChange={e => setCont(e.target.value)} aria-invalid={!valido} />
        </label>
        <button className="btn btn-primario !py-2" onClick={novo}>Adicionar linha</button>
        <button className="btn btn-borda !py-2" onClick={csv}>Exportar CSV</button>
        <button className="btn btn-borda !py-2" onClick={() => window.print()}>Imprimir / PDF</button>
      </div>
      {!valido && <p role="alert" className="mt-2 text-sm text-red-300">A contingência deve ser um número entre 0 e 100.</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="tabela w-full min-w-[900px] text-sm">
          <thead><tr><th>Categoria</th><th>Serviço</th><th>Un.</th><th>Quantidade</th><th>Preço unit. (R$)</th><th>Total</th><th>Fonte / data</th><th className="no-print" /></tr></thead>
          <tbody>
            {vis.map(l => (
              <tr key={l.id}>
                <td><select className="rounded bg-gelo p-1 text-marinho" value={l.categoria} onChange={e => set(l.id, { categoria: e.target.value as Categoria })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select></td>
                <td><input aria-label="Serviço" value={l.servico} onChange={e => set(l.id, { servico: e.target.value })} /></td>
                <td><input aria-label="Unidade" value={l.unidade} onChange={e => set(l.id, { unidade: e.target.value })} /></td>
                <td><input aria-label="Quantidade" inputMode="decimal" defaultValue={l.quantidade} key={l.id + "q"} onChange={e => set(l.id, { quantidade: lerNum(e.target.value) })} /></td>
                <td><input aria-label="Preço unitário" inputMode="decimal" defaultValue={l.preco} key={l.id + "p"} onChange={e => set(l.id, { preco: lerNum(e.target.value) })} /></td>
                <td className="whitespace-nowrap font-semibold">{brl(totalLinha(l))}</td>
                <td className="text-xs text-tecnico">{l.fonte} · {l.data}{l.obs ? ` · ${l.obs}` : ""}</td>
                <td className="no-print"><button className="text-red-300 underline" onClick={() => apagar(l)}>Apagar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {r && (
        <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Resumo do orçamento">
          <div className="glass p-5">
            <h2 className="text-xl font-bold">Distribuição de custos</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {CATEGORIAS.map(c => {
                const v = r.subtotais[c], p = r.subtotal > 0 ? (v / r.subtotal) * 100 : 0;
                return (
                  <li key={c}>
                    <div className="flex justify-between"><span>{c}</span><span>{brl(v)} ({p.toFixed(1)}%)</span></div>
                    <div className="mt-1 h-2 rounded bg-white/10"><div className="h-2 rounded bg-gradient-to-r from-eletrico to-claro" style={{ width: `${p}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="glass p-5 text-sm">
            <h2 className="text-xl font-bold">Totais</h2>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{brl(r.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Contingência ({pct}%) — hipótese</dt><dd>{brl(r.contingencia)}</dd></div>
              <div className="flex justify-between border-t border-white/20 pt-2 text-lg font-bold text-claro"><dt>Total estimado</dt><dd>{brl(r.total)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-tecnico">Valores fictícios. As quantidades de área vêm da base geométrica compartilhada.</p>
          </div>
        </section>
      )}
    </div>
  );
}
