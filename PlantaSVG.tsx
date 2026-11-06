import { DRENAGEM, ELEMENTOS, LARG_TAXI, TAXIS, TERRENO, porId } from "@/lib/dados";

export const VB_PADRAO = { x: -530, y: -470, w: 1060, h: 880 };
export type Vista = typeof VB_PADRAO;
export type CamadasPlanta = { elementos: boolean; drenagem: boolean; cotas: boolean; verdes: boolean; rotulos: boolean };
export const CAMADAS_PLANTA: CamadasPlanta = { elementos: true, drenagem: true, cotas: true, verdes: true, rotulos: true };

export const COR_PLANTA: Record<string, string> = { pista: "#2e343e", taxiway: "#454f5e", patio: "#566274", patioN: "#566274", terminal: "#8BCBFF", torre: "#d7dfea", hangar: "#A8B7C9", hangar2: "#A8B7C9", galpao: "#7b8798", oficina: "#8c98a9", predios: "#c9d3e0", estacionamento: "#1d2b3d", acesso: "#2a3442" };

type Props = {
  vista?: Vista; camadas?: CamadasPlanta; selecionado?: string | null;
  onSelecionar?: (id: string) => void; svgRef?: React.Ref<SVGSVGElement>;
};

export default function PlantaSVG({ vista = VB_PADRAO, camadas = CAMADAS_PLANTA, selecionado = null, onSelecionar, svgRef }: Props) {
  const u = vista.w / 1000;
  const alvo = [50, 100, 200, 500].filter(n => n <= vista.w * 0.25).pop() ?? 50;
  const ex = vista.x + vista.w * 0.03, ey = vista.y + vista.h * 0.96;
  const pista = porId("pista")!, terminal = porId("terminal")!, patio = porId("patio")!;
  const cota = (x1: number, y1: number, x2: number, y2: number, txt: string, vertical = false) => (
    <g stroke="#ffd23f" strokeWidth={u * 1.3} fill="#ffd23f" key={txt + x1 + y1}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical ? <><line x1={x1 - 6} y1={y1} x2={x1 + 6} y2={y1} /><line x1={x2 - 6} y1={y2} x2={x2 + 6} y2={y2} /></> : <><line x1={x1} y1={y1 - 6} x2={x1} y2={y1 + 6} /><line x1={x2} y1={y2 - 6} x2={x2} y2={y2 + 6} /></>}
      <text x={(x1 + x2) / 2 + (vertical ? 10 : 0)} y={(y1 + y2) / 2 + (vertical ? 4 : -7)} fontSize={u * 12} stroke="none" textAnchor={vertical ? "start" : "middle"}>{txt}</text>
    </g>
  );
  const clique = (id: string) => ({
    tabIndex: onSelecionar ? 0 : -1, role: onSelecionar ? "button" : undefined, style: { cursor: onSelecionar ? "pointer" : "default" } as React.CSSProperties,
    onClick: () => onSelecionar?.(id), onKeyDown: (ev: React.KeyboardEvent) => { if (ev.key === "Enter" || ev.key === " ") onSelecionar?.(id); },
  });
  return (
    <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`${vista.x} ${vista.y} ${vista.w} ${vista.h}`} role="img" aria-label="Planta esquemática do aeródromo" className="h-full w-full touch-none select-none" style={{ background: "#071B33" }}>
      <title>Planta esquemática do aeródromo — dimensionamento não validado</title>
      <defs><pattern id="grade" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#12304f" strokeWidth={u * 0.8} /></pattern></defs>
      <rect x={-3000} y={-3000} width={6000} height={6000} fill="url(#grade)" />
      <rect x={TERRENO.x[0]} y={TERRENO.z[0]} width={TERRENO.x[1] - TERRENO.x[0]} height={TERRENO.z[1] - TERRENO.z[0]} fill={camadas.verdes ? "#0f3a2a" : "#0b2238"} fillOpacity={0.85} stroke="#8BCBFF" strokeDasharray={`${u * 30} ${u * 15}`} strokeWidth={u * 1.6} />
      <line x1={-520} y1={-432} x2={520} y2={-432} stroke="#5b6b80" strokeWidth={14} />
      <text x={-515} y={-446} fontSize={u * 11} fill="#8b9bb0">BR (fora do terreno)</text>
      {camadas.elementos && ELEMENTOS.filter(e => e.tipo !== "rede").map(e => {
        const ativo = selecionado === e.id;
        return <rect key={e.id} x={e.centro[0] - e.dim[0] / 2} y={e.centro[1] - e.dim[1] / 2} width={e.dim[0]} height={e.dim[1]} fill={COR_PLANTA[e.id]} stroke={ativo ? "#8BCBFF" : "#0b1624"} strokeWidth={ativo ? u * 3 : u} aria-label={`${e.nome}, ${e.dim[0]} por ${e.dim[1]} metros`} {...clique(e.id)} />;
      })}
      {camadas.elementos && (
        <g fill="none" strokeLinejoin="round" strokeLinecap="butt">
          {TAXIS.map(t => (
            <g key={t.id}>
              <polyline points={t.pts.map(p => p.join(",")).join(" ")} stroke={selecionado === "taxiway" ? "#6aa8d8" : COR_PLANTA.taxiway} strokeWidth={LARG_TAXI} {...clique("taxiway")} />
              <polyline points={t.pts.map(p => p.join(",")).join(" ")} stroke="#ffd23f" strokeWidth={u * 1.3} strokeDasharray={`${u * 10} ${u * 8}`} pointerEvents="none" />
            </g>
          ))}
          <line x1={pista.centro[0]} y1={pista.centro[1] - pista.dim[1] / 2 + 20} x2={pista.centro[0]} y2={pista.centro[1] + pista.dim[1] / 2 - 20} stroke="#F5F8FC" strokeWidth={u * 1.6} strokeDasharray={`${u * 22} ${u * 16}`} pointerEvents="none" />
        </g>
      )}
      {camadas.drenagem && (
        <g fill="none" stroke="#3aa0ff" strokeWidth={u * 2.2} strokeDasharray={`${u * 12} ${u * 8}`} pointerEvents="none">
          {DRENAGEM.linhas.map((l, i) => <polyline key={i} points={l.map(p => p.join(",")).join(" ")} />)}
          <circle cx={DRENAGEM.bacia.centro[0]} cy={DRENAGEM.bacia.centro[1]} r={DRENAGEM.bacia.raio} fill="#1d5fa8" fillOpacity={0.6} strokeDasharray="none" />
        </g>
      )}
      {camadas.cotas && (
        <g pointerEvents="none">
          {cota(pista.centro[0] - 55, pista.centro[1] - pista.dim[1] / 2, pista.centro[0] - 55, pista.centro[1] + pista.dim[1] / 2, `${pista.dim[1]} m`, true)}
          {cota(pista.centro[0] - pista.dim[0] / 2, pista.centro[1] - pista.dim[1] / 2 - 14, pista.centro[0] + pista.dim[0] / 2, pista.centro[1] - pista.dim[1] / 2 - 14, `${pista.dim[0]} m`)}
          {cota(patio.centro[0] - patio.dim[0] / 2, patio.centro[1] + patio.dim[1] / 2 + 8, patio.centro[0] + patio.dim[0] / 2, patio.centro[1] + patio.dim[1] / 2 + 8, `${patio.dim[0]} m`)}
          {cota(terminal.centro[0] - terminal.dim[0] / 2, terminal.centro[1] - terminal.dim[1] / 2 - 8, terminal.centro[0] + terminal.dim[0] / 2, terminal.centro[1] - terminal.dim[1] / 2 - 8, `${terminal.dim[0]} m`)}
        </g>
      )}
      {camadas.rotulos && (
        <g fill="#F5F8FC" fontSize={u * 11} fontWeight={600} textAnchor="middle" pointerEvents="none">
          {ELEMENTOS.filter(e => e.tipo !== "rede" && e.id !== "pista" && e.id !== "acesso").map(e => <text key={e.id} x={e.centro[0]} y={e.centro[1] + 4} fill={["terminal", "hangar", "hangar2", "predios", "torre"].includes(e.id) ? "#071B33" : "#F5F8FC"}>{e.nome}</text>)}
          <text x={pista.centro[0]} y={pista.centro[1] + pista.dim[1] / 2 - 6} fill="#F5F8FC">Cab. 27</text>
          <text x={pista.centro[0]} y={pista.centro[1] - pista.dim[1] / 2 + 16} fill="#F5F8FC">Cab. 09</text>
          <text x={0} y={190} fill="#ffd23f">Rede de táxi (A, B, C)</text>
          <text x={DRENAGEM.bacia.centro[0]} y={DRENAGEM.bacia.centro[1] - 36} fill="#8BCBFF">Bacia (esquemática)</text>
        </g>
      )}
      <g pointerEvents="none">
        <rect x={ex} y={ey} width={alvo / 2} height={u * 6} fill="#F5F8FC" />
        <rect x={ex + alvo / 2} y={ey} width={alvo / 2} height={u * 6} fill="#8BCBFF" />
        <text x={ex} y={ey - u * 5} fontSize={u * 12} fill="#F5F8FC">0</text>
        <text x={ex + alvo} y={ey - u * 5} fontSize={u * 12} fill="#F5F8FC" textAnchor="end">{alvo} m</text>
        <text x={vista.x + vista.w * 0.015} y={vista.y + vista.h * 0.035} fontSize={u * 13} fill="#ffb347" fontWeight={700}>ESQUEMÁTICO — dimensionamento não validado</text>
      </g>
    </svg>
  );
}
