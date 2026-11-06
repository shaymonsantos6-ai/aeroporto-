"use client";
import { useEffect, useState } from "react";
import { ELEMENTOS, LARG_TAXI, S, TAXIS, TERRENO } from "@/lib/dados";
import { COR_PLANTA } from "./PlantaSVG";

export type InfoJogador = { x: number; z: number; az: number };

export default function Radar({ info, visitados }: { info: React.RefObject<InfoJogador>; visitados: string[] }) {
  const [p, setP] = useState<InfoJogador>({ x: -2, z: -12.6, az: Math.PI });
  useEffect(() => { const id = window.setInterval(() => setP({ ...info.current }), 100); return () => window.clearInterval(id); }, [info]);
  const mx = p.x / S, mz = p.z / S;
  return (
    <div className="glass pointer-events-none fixed right-3 top-20 z-30 w-36 p-1.5 md:bottom-3 md:left-3 md:right-auto md:top-auto md:w-52" aria-label="Radar do aeroporto" role="img">
      <svg viewBox="-530 -470 1060 880" className="w-full rounded bg-[#06172b]">
        <rect x={TERRENO.x[0]} y={TERRENO.z[0]} width={TERRENO.x[1] - TERRENO.x[0]} height={TERRENO.z[1] - TERRENO.z[0]} fill="#0f3a2a" stroke="#8BCBFF" strokeWidth="5" />
        {ELEMENTOS.filter(e => e.tipo !== "rede").map(e => (
          <rect key={e.id} x={e.centro[0] - e.dim[0] / 2} y={e.centro[1] - e.dim[1] / 2} width={e.dim[0]} height={e.dim[1]} fill={COR_PLANTA[e.id]} stroke={visitados.includes(e.id) ? "#35ff88" : "none"} strokeWidth="9" />
        ))}
        {TAXIS.map(t => <polyline key={t.id} points={t.pts.map(q => q.join(",")).join(" ")} fill="none" stroke={visitados.includes("taxiway") ? "#35ff88" : COR_PLANTA.taxiway} strokeWidth={LARG_TAXI} strokeLinejoin="round" />)}
        <g transform={`translate(${mx} ${mz}) rotate(${(-p.az * 180) / Math.PI})`}>
          <circle r="40" fill="#ffd23f" opacity="0.25" />
          <polygon points="0,-36 22,26 0,12 -22,26" fill="#ffd23f" stroke="#071B33" strokeWidth="5" />
        </g>
      </svg>
      <p className="mt-1 text-center text-[10px] text-tecnico">Radar · verde = já inspecionado</p>
    </div>
  );
}
