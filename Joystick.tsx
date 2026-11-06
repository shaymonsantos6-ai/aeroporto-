"use client";
import { useRef, useState } from "react";
import type { Joy } from "./Jogador";

export default function Joystick({ joy }: { joy: React.RefObject<Joy> }) {
  const [k, setK] = useState({ x: 0, y: 0 });
  const base = useRef<HTMLDivElement>(null);
  const mover = (e: React.PointerEvent) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    joy.current.x = dx; joy.current.y = -dy;
    setK({ x: dx, y: dy });
  };
  const parar = () => { joy.current.x = 0; joy.current.y = 0; setK({ x: 0, y: 0 }); };
  return (
    <div ref={base} role="application" aria-label="Controle de movimento"
      className="fixed bottom-8 left-6 z-30 h-32 w-32 touch-none rounded-full border border-claro/50 bg-[#071B33]/50 backdrop-blur"
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); mover(e); }}
      onPointerMove={e => { if (e.buttons) mover(e); }} onPointerUp={parar} onPointerCancel={parar}>
      <div className="pointer-events-none absolute h-14 w-14 rounded-full bg-eletrico/80" style={{ left: `calc(50% - 28px + ${k.x * 36}px)`, top: `calc(50% - 28px + ${k.y * 36}px)` }} />
    </div>
  );
}
