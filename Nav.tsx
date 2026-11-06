"use client";
import { assetPath } from "@/lib/asset-path";
import Link from "next/link";
import { useState } from "react";

const LINKS: [string, string][] = [
  ["/", "Início"], ["/#modelo", "Modelo 3D"], ["/planta", "Planta técnica"], ["/calculadoras", "Calculadoras"],
  ["/memorial", "Memorial"], ["/orcamento", "Orçamento"], ["/referencias", "Referências"],
];

export default function Nav() {
  const [aberto, setAberto] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#071B33]/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-2 md:px-8">
        <Link href="/" className="shrink-0" aria-label="Aeroporto Os Tchutchucos — página inicial">
          <img src={assetPath("/brand/logo-horizontal.png")} alt="Aeroporto Os Tchutchucos — Estudantes de Engenharia UDF" className="h-11 w-auto" />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {LINKS.map(([h, t]) => <Link key={h} href={h} className="text-gelo/85 transition hover:text-claro">{t}</Link>)}
        </nav>
        <button type="button" className="rounded border border-white/25 px-3 py-2 text-sm lg:hidden" aria-expanded={aberto} aria-controls="menu-mobile" onClick={() => setAberto(v => !v)}>
          {aberto ? "Fechar" : "Menu"}
        </button>
      </div>
      {aberto && (
        <nav id="menu-mobile" aria-label="Menu móvel" className="flex flex-col border-t border-white/10 bg-[#071B33]/95 px-4 pb-4 lg:hidden">
          {LINKS.map(([h, t]) => <Link key={h} href={h} onClick={() => setAberto(false)} className="border-b border-white/10 py-3">{t}</Link>)}
        </nav>
      )}
    </header>
  );
}
