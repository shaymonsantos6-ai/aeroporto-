"use client";
import { assetPath } from "@/lib/asset-path";
import { useEffect, useState } from "react";
import { ler, limpar } from "@/lib/memorial";
import { paraCsv, type Resultado } from "@/lib/calculos";

export default function Memorial() {
  const [lista, setLista] = useState<Resultado[]>([]);
  useEffect(() => setLista(ler()), []);
  const porDisc = lista.reduce<Record<string, Resultado[]>>((a, r) => ((a[r.disciplina] ??= []).push(r), a), {});

  function csv() {
    const blob = new Blob(["\uFEFF" + paraCsv(lista)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "memorial-tchutchucos.csv"; a.click(); URL.revokeObjectURL(a.href);
  }
  function apagar() { if (confirm("Apagar todos os cálculos salvos neste navegador? Esta ação não pode ser desfeita.")) { limpar(); setLista([]); } }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-12 pt-28">
      <h1 className="text-3xl font-bold">Memorial de cálculo</h1>
      <p className="mt-1 text-sm text-tecnico">Gerado somente a partir dos cálculos registrados. Armazenado no navegador (localStorage): some se os dados do site forem limpos e não é compartilhado entre dispositivos.</p>
      <div className="no-print mt-4 flex gap-2">
        <button disabled={!lista.length} onClick={csv} className="rounded bg-eletrico px-3 py-2 disabled:opacity-40">Exportar CSV</button>
        <button disabled={!lista.length} onClick={() => window.print()} className="rounded bg-eletrico px-3 py-2 disabled:opacity-40">Imprimir / salvar PDF</button>
        <button disabled={!lista.length} onClick={apagar} className="rounded border border-red-400 px-3 py-2 disabled:opacity-40">Apagar tudo</button>
      </div>
      {!lista.length && <p className="mt-6">Nenhum cálculo registrado. Faça um cálculo em <a className="underline" href={assetPath("/calculadoras")}>Calculadoras</a> e use “Registrar no memorial”.</p>}
      {Object.entries(porDisc).map(([d, itens]) => (
        <section key={d} className="mt-6">
          <h2 className="text-xl font-semibold">{d}</h2>
          {itens.map((r, i) => (
            <article key={i} className="glass mt-3 p-4 text-sm">
              <h3 className="font-bold">{r.nome}</h3>
              <p>{r.formula}</p><p>{r.substituicao}</p>
              <p className="text-tecnico">{r.hipoteses.join(" · ")}</p>
              <p>Situação: {r.validacao} — {new Date(r.data).toLocaleString("pt-BR")}</p>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
