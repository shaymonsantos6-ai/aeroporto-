// Agentes que seguem rotas (pessoas, carros, veículos de apoio). Cálculo puro, sem React.
export type P2 = [number, number];
export type Rota = { pts: P2[]; vel: number; rot?: number; espera?: Record<number, number>; pausa?: number; fase?: number };
type Seg = { t0: number; dur: number; x0: number; z0: number; x1: number; z1: number; rot: number; parado: boolean };
export type Compilada = { segs: Seg[]; ativo: number; total: number; fase: number };
export type Estado = { x: number; z: number; rot: number; parado: boolean; visivel: boolean; esc: number };

export function compilar(r: Rota): Compilada {
  if (r.pts.length === 1) {
    const [x, z] = r.pts[0];
    return { segs: [{ t0: 0, dur: 1e9, x0: x, z0: z, x1: x, z1: z, rot: r.rot ?? 0, parado: true }], ativo: 1e9, total: 1e9 + 1, fase: 0 };
  }
  const segs: Seg[] = [];
  let t = 0;
  let rot = r.pts.length > 1 ? -Math.atan2(r.pts[1][1] - r.pts[0][1], r.pts[1][0] - r.pts[0][0]) : 0;
  for (let i = 0; i < r.pts.length; i++) {
    const [x0, z0] = r.pts[i];
    const e = r.espera?.[i] ?? 0;
    if (e > 0) { segs.push({ t0: t, dur: e, x0, z0, x1: x0, z1: z0, rot, parado: true }); t += e; }
    if (i < r.pts.length - 1) {
      const [x1, z1] = r.pts[i + 1];
      rot = -Math.atan2(z1 - z0, x1 - x0);
      const dur = Math.hypot(x1 - x0, z1 - z0) / r.vel;
      segs.push({ t0: t, dur, x0, z0, x1, z1, rot, parado: false });
      t += dur;
    }
  }
  return { segs, ativo: t, total: t + (r.pausa ?? 0) + 0.001, fase: r.fase ?? 0 };
}

export function estadoRota(c: Compilada, t: number): Estado {
  const tt = (((t + c.fase) % c.total) + c.total) % c.total;
  if (tt >= c.ativo || c.segs.length === 0) return { x: 0, z: 0, rot: 0, parado: true, visivel: false, esc: 0 };
  let s = c.segs[c.segs.length - 1];
  for (const q of c.segs) { if (tt < q.t0 + q.dur) { s = q; break; } }
  const f = s.dur > 0 ? Math.min(1, Math.max(0, (tt - s.t0) / s.dur)) : 1;
  return { x: s.x0 + (s.x1 - s.x0) * f, z: s.z0 + (s.z1 - s.z0) * f, rot: s.rot, parado: s.parado, visivel: true, esc: Math.max(0.001, Math.min(1, tt / 0.5, (c.ativo - tt) / 0.5)) };
}
