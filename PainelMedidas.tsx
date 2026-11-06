"use client";
import Link from "next/link";
import { medidasDe, type Elemento } from "@/lib/dados";

export default function PainelMedidas({ elemento, onFechar }: { elemento: Elemento | null; onFechar: () => void }) {
  if (!elemento) return null;
  return (
    <aside aria-live="polite" className="glass fixed inset-x-3 bottom-3 z-30 max-h-[45vh] overflow-y-auto p-4 md:inset-x-auto md:bottom-auto md:right-4 md:top-20 md:w-80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-claro">MEDIDAS DO ELEMENTO</p>
          <h3 className="mt-0.5 text-lg font-bold leading-tight">{elemento.nome}</h3>
        </div>
        <button type="button" onClick={onFechar} aria-label="Fechar painel" className="rounded border border-white/25 px-2 py-0.5 text-sm hover:bg-white/10">×</button>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        {medidasDe(elemento).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-white/10 pb-1"><dt className="text-tecnico">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-tecnico">Memorial: <Link href="/memorial" className="underline">{elemento.secaoMemorial}</Link>. Dimensões hipotéticas e acadêmicas.</p>
    </aside>
  );
}
