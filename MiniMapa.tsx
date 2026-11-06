"use client";
import { useEffect, useState } from "react";
import { CIDADES, CONTORNO, REDE, agora, nomeCidade, posicaoVoo, proj, voosAtivos } from "@/lib/voos";

const par = (cod: string) => { const c = CIDADES.find(x => x.cod === cod)!; return proj(c.lat, c.lon); };
const ROTULO = { saida: "Partida", chegada: "Chegada", rede: "Em rota" } as const;

export default function MiniMapa({ aberto, onAlternar, reduzido }: { aberto: boolean; onAlternar: () => void; reduzido: boolean }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!aberto) return;
    const id = window.setInterval(() => setT(agora()), reduzido ? 1000 : 100);
    return () => window.clearInterval(id);
  }, [aberto, reduzido]);

  if (!aberto) {
    return <button type="button" onClick={onAlternar} className="btn btn-borda fixed bottom-3 right-3 z-30 !px-3 !py-2 text-xs backdrop-blur">Mapa de voos</button>;
  }
  const voos = voosAtivos(t);
  return (
    <aside className="glass fixed bottom-3 right-3 z-30 w-[min(17rem,calc(100vw-1.5rem))] p-3" aria-label="Mapa de voos simulados">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wide">MAPA DE VOOS (SIMULAÇÃO)</h2>
        <button type="button" onClick={onAlternar} aria-label="Recolher mapa" className="rounded border border-white/25 px-2 text-xs hover:bg-white/10">−</button>
      </div>
      <svg viewBox="0 0 100 100" className="w-full rounded bg-[#06172b]" role="img" aria-label="Mapa esquemático do Brasil com rotas aéreas simuladas">
        <polygon points={CONTORNO.map(([la, lo]) => proj(la, lo).join(",")).join(" ")} fill="#0f2d4d" stroke="#2c5d8f" strokeWidth="0.5" />
        {REDE.map(f => { const a = par(f.a), b = par(f.b); return <line key={f.a + f.b} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#1d4a78" strokeWidth="0.35" />; })}
        {voos.map(v => { const a = par(v.de), b = par(v.para); return <line key={"l" + v.id} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={v.tipo === "rede" ? "#5aa9ff" : "#ffd23f"} strokeWidth="0.6" strokeDasharray="1.6 1.2" />; })}
        {CIDADES.map(c => {
          const [x, y] = proj(c.lat, c.lon), hub = c.cod === "TCH";
          return (
            <g key={c.cod}>
              <circle cx={x} cy={y} r={hub ? 2.2 : 1.2} fill={hub ? "#087BFF" : "#8BCBFF"} stroke={hub ? "#fff" : "none"} strokeWidth="0.5" />
              <text x={x + 2.2} y={y + 1} fontSize="3.4" fill="#F5F8FC">{c.cod}</text>
            </g>
          );
        })}
        {voos.map(v => {
          const a = par(v.de), b = par(v.para), p = posicaoVoo(v), [x, y] = proj(p.lat, p.lon);
          const rumo = (Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180) / Math.PI;
          return (
            <g key={"p" + v.id} transform={`translate(${x} ${y}) rotate(${rumo}) scale(0.8)`}>
              <path d="M0 -3.2 L0.7 -0.6 L3 0.8 L3 1.5 L0.7 0.8 L0.5 2.6 L1.6 3.3 L1.6 3.9 L0 3.5 L-1.6 3.9 L-1.6 3.3 L-0.5 2.6 L-0.7 0.8 L-3 1.5 L-3 0.8 L-0.7 -0.6 Z" fill={v.tipo === "rede" ? "#F5F8FC" : "#ffd23f"} stroke="#071B33" strokeWidth="0.4" />
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 space-y-0.5 text-[11px]">
        {voos.filter(v => v.tipo !== "rede").concat(voos.filter(v => v.tipo === "rede").slice(0, 3)).slice(0, 5).map(v => (
          <li key={v.id} className="flex justify-between gap-2"><span><b>{v.num}</b> {nomeCidade(v.de)} → {nomeCidade(v.para)}</span><span className="text-tecnico">{ROTULO[v.tipo]} {Math.round(v.p * 100)}%</span></li>
        ))}
      </ul>
      <p className="mt-1.5 text-[10px] leading-snug text-tecnico">Ilustrativo: rotas, horários e números de voo são fictícios. Hub TCH = aeroporto do projeto.</p>
    </aside>
  );
}
