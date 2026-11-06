export type P2 = [number, number];

// Suavização de cantos (Chaikin): transforma uma polilinha em uma curva sem "quinas"
export function suavizar(pts: P2[], it = 3): P2[] {
  let p = pts;
  for (let k = 0; k < it; k++) {
    if (p.length < 3) break;
    const q: P2[] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      q.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}

export type Trajeto = { len: number; em: (s: number) => { x: number; z: number; rot: number } };

// Posição e direção (rot = rotação em Y para um modelo com a frente em +x) a uma distância s do início
export function criarTrajeto(pts: P2[]): Trajeto {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = acc[acc.length - 1];
  const em = (s: number) => {
    const t = Math.min(len, Math.max(0, s));
    let i = 1;
    while (i < acc.length - 1 && acc[i] < t) i++;
    const a = pts[i - 1], b = pts[i], f = (t - acc[i - 1]) / Math.max(1e-9, acc[i] - acc[i - 1]);
    return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f, rot: -Math.atan2(b[1] - a[1], b[0] - a[0]) };
  };
  return { len, em };
}
