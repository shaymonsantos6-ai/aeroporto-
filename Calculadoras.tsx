"use client";
import { useState } from "react";
import { areaRetangular, escalaMaquete, declividade, metodoRacional, areasMedias, volumeCamada, vagasEstacionamento, type Resultado } from "@/lib/calculos";
import { registrar } from "@/lib/memorial";

type Campo = { k: string; label: string; padrao: string };
type Calc = { id: string; nome: string; campos: Campo[]; run: (v: Record<string, number>, txt: string) => Resultado };

const CALCS: Calc[] = [
  { id: "pista", nome: "Geometria da pista", campos: [{ k: "c", label: "Comprimento (m)", padrao: "1200" }, { k: "l", label: "Largura (m)", padrao: "30" }], run: v => areaRetangular(v.c, v.l) },
  { id: "escala", nome: "Escala da maquete", campos: [{ k: "r", label: "Medida real (m)", padrao: "1200" }, { k: "n", label: "Denominador N (1:N)", padrao: "500" }], run: v => escalaMaquete(v.r, v.n) },
  { id: "decl", nome: "Declividade", campos: [{ k: "dh", label: "Diferença de nível (m)", padrao: "2" }, { k: "d", label: "Distância horizontal (m)", padrao: "100" }], run: v => declividade(v.dh, v.d) },
  { id: "rac", nome: "Drenagem — método racional", campos: [{ k: "c", label: "Coeficiente C (0 a 1)", padrao: "0.9" }, { k: "i", label: "Intensidade i (mm/h)", padrao: "100" }, { k: "a", label: "Área contribuinte (ha)", padrao: "3.6" }], run: v => metodoRacional(v.c, v.i, v.a) },
  { id: "cam", nome: "Pavimentação — volume de camada", campos: [{ k: "a", label: "Área (m²)", padrao: "36000" }, { k: "e", label: "Espessura (cm)", padrao: "20" }], run: v => volumeCamada(v.a, v.e) },
  { id: "vag", nome: "Estacionamento — vagas", campos: [{ k: "a", label: "Área do estacionamento (m²)", padrao: "10500" }, { k: "v", label: "Área por vaga com circulação (m²)", padrao: "25" }], run: v => vagasEstacionamento(v.a, v.v) },
];

export default function Calculadoras() {
  const [idx, setIdx] = useState(0);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [txt, setTxt] = useState("0,10\n20,30\n40,20");
  const [res, setRes] = useState<Resultado | null>(null);
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; t: string } | null>(null);
  const c = idx < CALCS.length ? CALCS[idx] : null;

  function calcular() {
    try {
      if (c) {
        const v = Object.fromEntries(c.campos.map(f => [f.k, Number((vals[f.k] ?? f.padrao).replace(",", "."))]));
        setRes(c.run(v, txt));
      } else {
        const secoes = txt.trim().split("\n").map(l => { const [d, a] = l.split(",").map(s => Number(s.trim().replace(",", "."))); return { distancia: d, area: a }; });
        setRes(areasMedias(secoes));
      }
      setMsg(null);
    } catch (e) { setRes(null); setMsg({ tipo: "erro", t: (e as Error).message }); }
  }
  function salvar() { if (res) { registrar(res); setMsg({ tipo: "ok", t: "Cálculo registrado no memorial (salvo neste navegador)." }); } }

  const nomes = [...CALCS.map(x => x.nome), "Terraplenagem — áreas médias"];
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {nomes.map((n, i) => <button key={n} role="tab" aria-selected={i === idx} onClick={() => { setIdx(i); setRes(null); setMsg(null); }} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${i === idx ? "bg-eletrico shadow-lg shadow-eletrico/40" : "bg-grafite hover:bg-grafite/70"}`}>{n}</button>)}
      </div>
      <div className="mt-5 grid max-w-md gap-3">
        {c ? c.campos.map(f => (
          <label key={f.k} className="grid gap-1 text-sm">{f.label}
            <input inputMode="decimal" className="rounded bg-gelo p-2 text-marinho" defaultValue={f.padrao} key={c.id + f.k} onChange={e => setVals(p => ({ ...p, [f.k]: e.target.value }))} />
          </label>
        )) : (
          <label className="grid gap-1 text-sm">Seções (uma por linha: distância, área em m²)
            <textarea rows={5} className="rounded bg-gelo p-2 text-marinho" value={txt} onChange={e => setTxt(e.target.value)} />
          </label>
        )}
        <button onClick={calcular} className="rounded bg-eletrico px-4 py-2 font-semibold">Calcular</button>
      </div>
      {msg && <p role={msg.tipo === "erro" ? "alert" : "status"} className={`mt-4 rounded border p-3 text-sm ${msg.tipo === "erro" ? "border-red-400" : "border-green-400"}`}>{msg.t}</p>}
      {res && (
        <section className="glass mt-5 max-w-xl p-5 text-sm">
          <h2 className="text-lg font-bold">{res.nome}</h2>
          <p className="mt-2"><strong>Fórmula:</strong> {res.formula}</p>
          <p><strong>Substituição:</strong> {res.substituicao}</p>
          <p className="mt-1 text-xl font-bold text-claro">{Number(res.resultado.toFixed(4)).toLocaleString("pt-BR")} {res.unidade}</p>
          <ul className="mt-2 list-disc pl-5 text-tecnico">{res.hipoteses.map(h => <li key={h}>{h}</li>)}</ul>
          <p className="mt-2">Situação: {res.validacao}</p>
          <button onClick={salvar} className="mt-3 rounded border border-eletrico px-3 py-2">Registrar no memorial</button>
        </section>
      )}
    </div>
  );
}
