"use client";
import { useEffect, useRef, useState } from "react";
import PlantaSVG, { CAMADAS_PLANTA, VB_PADRAO, type CamadasPlanta, type Vista } from "./PlantaSVG";
import { ELEMENTOS, TERRENO, area, areaTerreno, porId } from "@/lib/dados";

const fmt = (n: number) => n.toLocaleString("pt-BR");
const RAZAO = VB_PADRAO.h / VB_PADRAO.w;
const NOMES: [keyof CamadasPlanta, string][] = [["elementos", "Elementos"], ["drenagem", "Drenagem"], ["cotas", "Cotas"], ["verdes", "Áreas verdes"], ["rotulos", "Legendas"]];

export default function Planta() {
  const [vista, setVista] = useState<Vista>(VB_PADRAO);
  const [camadas, setCamadas] = useState<CamadasPlanta>(CAMADAS_PLANTA);
  const [sel, setSel] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const arrasto = useRef<{ x: number; y: number; v: Vista } | null>(null);
  const moveu = useRef(false);

  const zoom = (f: number, px = 0.5, py = 0.5) => setVista(v => {
    const w = Math.min(VB_PADRAO.w * 1.4, Math.max(120, v.w * f)), h = w * RAZAO;
    return { x: v.x + (v.w - w) * px, y: v.y + (v.h - h) * py, w, h };
  });

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const roda = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    el.addEventListener("wheel", roda, { passive: false });
    return () => el.removeEventListener("wheel", roda);
  }, []);

  const exportar = () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "planta-esquematica-tchutchucos.svg"; a.click(); URL.revokeObjectURL(a.href);
  };

  const atual = sel ? porId(sel) : null;
  return (
    <div>
      <div className="no-print mb-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="btn btn-borda !px-3 !py-1.5" onClick={() => zoom(1 / 1.3)} aria-label="Aproximar">+</button>
        <button className="btn btn-borda !px-3 !py-1.5" onClick={() => zoom(1.3)} aria-label="Afastar">−</button>
        <button className="btn btn-borda !px-3 !py-1.5" onClick={() => { setVista(VB_PADRAO); setSel(null); }}>Redefinir</button>
        <button className="btn btn-primario !px-3 !py-1.5" onClick={() => window.print()}>Imprimir</button>
        <button className="btn btn-primario !px-3 !py-1.5" onClick={exportar}>Exportar SVG</button>
        <span className="mx-2 hidden h-5 w-px bg-white/20 sm:block" />
        {NOMES.map(([k, n]) => <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={camadas[k]} onChange={e => setCamadas(c => ({ ...c, [k]: e.target.checked }))} />{n}</label>)}
      </div>
      <div className="relative">
        <div
          ref={caixa} tabIndex={0} aria-label="Área da planta: arraste para mover, role para ampliar, setas para deslocar"
          className="w-full cursor-grab overflow-hidden rounded-lg border border-white/15" style={{ aspectRatio: `${VB_PADRAO.w}/${VB_PADRAO.h}` }}
          onPointerDown={e => { arrasto.current = { x: e.clientX, y: e.clientY, v: vista }; moveu.current = false; }}
          onPointerMove={e => {
            const a = arrasto.current; if (!a || !caixa.current) return;
            const dx = e.clientX - a.x, dy = e.clientY - a.y;
            if (Math.abs(dx) + Math.abs(dy) > 4) moveu.current = true;
            const r = caixa.current.getBoundingClientRect();
            setVista({ ...a.v, x: a.v.x - (dx / r.width) * a.v.w, y: a.v.y - (dy / r.height) * a.v.h });
          }}
          onPointerUp={() => { arrasto.current = null; }} onPointerLeave={() => { arrasto.current = null; }}
          onKeyDown={e => {
            const p = vista.w * 0.06;
            if (e.key === "ArrowLeft") setVista(v => ({ ...v, x: v.x - p }));
            else if (e.key === "ArrowRight") setVista(v => ({ ...v, x: v.x + p }));
            else if (e.key === "ArrowUp") setVista(v => ({ ...v, y: v.y - p }));
            else if (e.key === "ArrowDown") setVista(v => ({ ...v, y: v.y + p }));
            else if (e.key === "+") zoom(1 / 1.3); else if (e.key === "-") zoom(1.3);
          }}
        >
          <PlantaSVG vista={vista} camadas={camadas} selecionado={sel} svgRef={svgRef} onSelecionar={id => { if (!moveu.current) setSel(id); }} />
        </div>
        <svg viewBox="0 0 40 60" className="pointer-events-none absolute right-3 top-3 h-14 w-10" aria-label="Norte" role="img"><path d="M20 4 L32 40 L20 33 L8 40 Z" fill="#F5F8FC" /><text x="20" y="57" textAnchor="middle" fontSize="14" fontWeight="700" fill="#F5F8FC">N</text></svg>
      </div>
      <p className="mt-2 rounded border border-yellow-500/60 p-2 text-xs text-yellow-200">Planta ESQUEMÁTICA e conceitual. Não possui dimensionamento técnico validado, levantamento topográfico nem aprovação de órgão regulador.</p>
      {atual && (
        <div className="glass mt-3 p-4 text-sm" aria-live="polite">
          <h3 className="font-bold">{atual.nome}</h3>
          <p>{fmt(atual.dim[0])} × {fmt(atual.dim[1])} m — área {fmt(area(atual))} m² — memorial: {atual.secaoMemorial}</p>
        </div>
      )}
      <h2 className="mt-6 text-xl font-bold">Quadro de áreas</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="tabela w-full text-sm">
          <thead><tr><th>Elemento</th><th>Dimensões (m)</th><th>Área (m²)</th><th>% do terreno</th></tr></thead>
          <tbody>
            {ELEMENTOS.map(e => <tr key={e.id}><td>{e.nome}</td><td>{fmt(e.dim[0])} × {fmt(e.dim[1])}</td><td>{fmt(area(e))}</td><td>{((area(e) / areaTerreno()) * 100).toFixed(2)}</td></tr>)}
            <tr className="font-bold"><td>Terreno</td><td>{fmt(TERRENO.x[1] - TERRENO.x[0])} × {fmt(TERRENO.z[1] - TERRENO.z[0])}</td><td>{fmt(areaTerreno())}</td><td>100</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
