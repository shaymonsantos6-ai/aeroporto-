import * as THREE from "three";
import { Construtor, CHAO } from "./construtor";
import { suavizar } from "@/lib/trajeto";
import { TERRENO, TAXIS, LARG_TAXI, S, ELEMENTOS, porId, caixaDe } from "@/lib/dados";
import { TERM, H1, H2, PAREDES_TERMINAL, PAREDES_H1, PAREDES_H2, type Ret, type Caixa } from "@/lib/colisao";

type P2 = [number, number];
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const passo = (a: number, b: number, p: number) => { const r: number[] = []; for (let v = a; p > 0 ? v <= b + 1e-6 : v >= b - 1e-6; v += p) r.push(v); return r; };
const u = (m: number) => m * S;

/* telha ondulada: faixas alternadas ao longo do eixo z */
function arcoFaixas(c: Construtor, h: Ret, base: number, esc: number) {
  const r = h.w / 2, N = 16;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI, a1 = ((i + 1) / N) * Math.PI;
    const s = new THREE.Shape();
    s.moveTo(Math.cos(a0) * r, Math.sin(a0) * r); s.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    s.lineTo(Math.cos(a1) * (r - 0.05), Math.sin(a1) * (r - 0.05)); s.lineTo(Math.cos(a0) * (r - 0.05), Math.sin(a0) * (r - 0.05)); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: h.d, bevelEnabled: false, curveSegments: 1 });
    g.translate(0, 0, -h.d / 2); g.scale(1, esc, 1); g.translate(h.cx, base, h.cz);
    c.geo("hangar", g, i % 2 ? "#aeb8c6" : "#bcc5d1");
  }
}
function empena(c: Construtor, h: Ret, sul: boolean, base: number, esc: number) {
  const r = h.w / 2, s = new THREE.Shape();
  s.moveTo(r, 0); s.absarc(0, 0, r, 0, Math.PI, false); s.closePath();
  if (sul) { const p = new THREE.Path(); p.moveTo(-1, 0.02); p.lineTo(-1, 1.8); p.lineTo(1, 1.8); p.lineTo(1, 0.02); p.closePath(); s.holes.push(p); }
  const g = new THREE.ShapeGeometry(s); if (!sul) g.rotateY(Math.PI);
  g.scale(1, esc, 1); g.translate(h.cx, base, h.cz + (sul ? h.d / 2 : -h.d / 2));
  c.geo("hangar", g, "#8d9bb0");
}

export function criarMundo() {
  const c = new Construtor();
  const P = CHAO;
  const pav = (cx: number, cz: number, w: number, d: number, hex: string, k = "chao") => c.caixa(k, cx, P / 2, cz, w, P, d, hex);
  const marca = (cx: number, cz: number, w: number, d: number, hex: string, k = "chao", rot = 0) => c.caixa(k, cx, P + 0.002, cz, w, 0.004, d, hex, rot);
  const sobre = (k: string, cx: number, cz: number, w: number, h: number, d: number, hex: string, dy = 0) => c.caixa(k, cx, P + dy + h / 2, cz, w, h, d, hex);
  const rect = (id: string) => { const e = porId(id)!; return { cx: u(e.centro[0]), cz: u(e.centro[1]), w: u(e.dim[0]), d: u(e.dim[1]), h: u(e.altura) }; };

  /* ---------- pista (eixo ao longo de z, como na maquete) ---------- */
  const R = rect("pista");
  pav(R.cx, R.cz, R.w, R.d, "#2b3038");
  const zs = R.cz + R.d / 2, zn = R.cz - R.d / 2;
  [-1, 1].forEach(s => marca(R.cx + s * 1.4, R.cz, 0.03, R.d - 1, "#d8dee8"));
  passo(zn + 1.5, zs - 1.5, 1.4).forEach(z => marca(R.cx, z, 0.08, 0.7, "#f5f8fc"));
  [zs - 0.7, zn + 0.7].forEach(z => passo(-1.2, 1.2, 0.3).forEach(dx => marca(R.cx + dx, z, 0.1, 1.2, "#f5f8fc")));
  [3, 4.5, 6].forEach(d => [zs - d - 1.2, zn + d + 1.2].forEach(z => [-0.4, 0.4].forEach(dx => marca(R.cx + dx, z, 0.1, 0.7, "#f5f8fc"))));
  [zs - 9, zn + 9].forEach(z => [-0.45, 0.45].forEach(dx => marca(R.cx + dx, z, 0.15, 1.6, "#f5f8fc")));

  /* ---------- pistas de táxi (curvas suavizadas) ---------- */
  const luz: P2[][] = [[], []]; // [pequenas...] preenchidas abaixo
  const taxiEdge: [number, number][] = [];
  const poli = (pts: [number, number][], larg: number, hex: string, linha: string | null, k = "chao") => {
    const d = suavizar(pts, 3).map(p => [u(p[0]), u(p[1])] as P2), w = u(larg);
    for (let i = 0; i < d.length - 1; i++) {
      const [x0, z0] = d[i], [x1, z1] = d[i + 1], len = Math.hypot(x1 - x0, z1 - z0);
      if (len < 1e-6) continue;
      const rot = -Math.atan2(z1 - z0, x1 - x0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      c.caixa(k, mx, P / 2, mz, len + 0.03, P, w, hex, rot);
      if (linha) marca(mx, mz, len + 0.03, 0.035, linha, k, rot);
      if (i % 2 === 0) { const nx = -(z1 - z0) / len, nz = (x1 - x0) / len; [-1, 1].forEach(s => taxiEdge.push([x0 + nx * s * (w / 2 - 0.02), z0 + nz * s * (w / 2 - 0.02)])); }
    }
  };
  TAXIS.forEach(t => poli(t.pts, LARG_TAXI, "#363e4a", "#ffd23f"));

  /* ---------- pátios ---------- */
  const MA = rect("patio"), NA = rect("patioN");
  pav(MA.cx, MA.cz, MA.w, MA.d, "#4a5463"); pav(NA.cx, NA.cz, NA.w, NA.d, "#4a5463");
  [MA, NA].forEach(a => {
    passo(a.cx - a.w / 2 + 3, a.cx + a.w / 2 - 3, 3).forEach(x => marca(x, a.cz, 0.012, a.d, "#3a4352"));
    passo(a.cz - a.d / 2 + 3, a.cz + a.d / 2 - 3, 3).forEach(z => marca(a.cx, z, a.w, 0.012, "#3a4352"));
    [-1, 1].forEach(s => marca(a.cx, a.cz + s * (a.d / 2 - 0.3), a.w - 0.6, 0.04, "#ffd23f"));
    [-1, 1].forEach(s => marca(a.cx + s * (a.w / 2 - 0.3), a.cz, 0.04, a.d - 0.6, "#ffd23f"));
  });
  [[-3, -3], [1.5, -5.5], [9.75, -7]].forEach(([x, z]) => { marca(x, z, 2.6, 0.03, "#ffd23f"); marca(x, z, 0.03, 2.6, "#ffd23f"); });

  /* ---------- cercas, portões, mastros, biruta ---------- */
  const x0 = u(TERRENO.x[0]), x1 = u(TERRENO.x[1]), z0 = u(TERRENO.z[0]), z1 = u(TERRENO.z[1]);
  const gatoN = (x: number, z: number) => z === z0 && Math.abs(x - u(-40)) < 1.1;
  const gatoS = (x: number, z: number) => z === z1 && Math.abs(x - u(-360)) < 0.9;
  for (let x = x0; x <= x1; x += 1.3) [z0, z1].forEach(z => { if (!gatoN(x, z) && !gatoS(x, z)) c.caixa("chao", x, 0.07, z, 0.03, 0.14, 0.03, "#7b8798"); });
  for (let z = z0; z <= z1; z += 1.3) [x0, x1].forEach(x => c.caixa("chao", x, 0.07, z, 0.03, 0.14, 0.03, "#7b8798"));
  [z0, z1].forEach(z => c.caixa("chao", 0, 0.11, z, x1 - x0, 0.01, 0.01, "#9aa6b6"));
  [x0, x1].forEach(x => c.caixa("chao", x, 0.11, 0, 0.01, 0.01, z1 - z0, "#9aa6b6"));
  [[-40, -380], [-360, 380]].forEach(([mx, mz]) => [-1, 1].forEach(s => c.caixa("chao", u(mx) + s * 0.9, 0.12, u(mz), 0.1, 0.24, 0.1, "#c9ced6")));

  const mastrosM: P2[] = [[-380, 100], [-120, 130], [60, 95], [-30, -145], [170, -85], [250, -85], [400, -300], [400, -250], [440, -200], [0, 250]];
  mastrosM.forEach(([mx, mz]) => { c.cil("chao", u(mx), 0.5, u(mz), 0.012, 0.016, 1.0, "#aab4c3"); c.caixa("chao", u(mx), 1.02, u(mz), 0.12, 0.04, 0.12, "#dfe6ee"); });
  c.cil("chao", u(100), 0.18, u(260), 0.01, 0.012, 0.36, "#d7dfea"); c.caixa("chao", u(100) + 0.08, 0.34, u(260), 0.16, 0.05, 0.05, "#ff5a30");
  [0, 1, 2, 3].forEach(i => c.caixa("chao", R.cx - 3 + i * 0.12, P + 0.02, zs - 6, 0.06, 0.04, 0.06, i < 2 ? "#ff3b3b" : "#f5f8fc"));

  /* ---------- via de acesso, estacionamento, portarias ---------- */
  const AC = rect("acesso"), EST = rect("estacionamento");
  const zi1 = AC.cz + AC.d / 2;
  pav(AC.cx, (z0 + zi1) / 2, AC.w, zi1 - z0, "#222b36");
  passo(z0 + 0.5, zi1 - 0.5, 1.2).forEach(z => marca(AC.cx, z, 0.025, 0.5, "#ffd23f"));
  pav(EST.cx, EST.cz, EST.w, EST.d, "#1c2634");
  pav(AC.cx - 0.65, -13.7, 0.8, 0.45, "#222b36");
  [-14.6, -12.75].forEach(z => passo(EST.cx - EST.w / 2 + 0.15, EST.cx + EST.w / 2 - 0.1, 0.17).forEach(x => marca(x, z, 0.006, 0.3, "#e9eef5")));
  const ext = (cx: number, cz: number, w: number, d: number, hex: string) => c.caixa("externo", cx, P / 2, cz, w, P, d, hex);
  ext(AC.cx, u(-405), 0.7, 2.5, "#222b36");                       // continuação da via até a BR
  ext(0, u(-432), 240, 0.7, "#222b36");                            // BR
  passo(-105, 105, 1.4).forEach(x => c.caixa("externo", x, P + 0.002, u(-432), 0.5, 0.004, 0.025, "#ffd23f"));
  [0.31, -0.31].forEach(dz => c.caixa("externo", 0, P + 0.002, u(-432) + dz, 240, 0.004, 0.02, "#f5f8fc"));
  poli([[-360, 380], [-360, 330], [-390, 260], [-380, 215]], 12, "#262f3b", "#e9eef5");   // estrada de serviço sul
  sobre("edif", u(-335), u(350), 1.1, 0.35, 0.8, "#d7dfea"); sobre("edif", u(-335), u(350), 1.2, 0.05, 0.9, "#5c6573", 0.35);
  sobre("edif", u(-60), u(-365), 0.7, 0.3, 0.5, "#d7dfea"); sobre("edif", u(-60), u(-365), 0.8, 0.05, 0.6, "#5c6573", 0.3);
  sobre("edif", u(-400), u(330), 1.5, 0.04, 0.75, "#8a929f", 0.28); [-0.6, 0.6].forEach(dx => [-0.3, 0.3].forEach(dz => c.cil("edif", u(-400) + dx, P + 0.14, u(330) + dz, 0.015, 0.015, 0.28, "#aab4c3", 6)));

  /* ---------- terminal (interior completo; mapeamento: z antigo -> espelhado) ---------- */
  const X = (x: number) => TERM.cx + x, Z = (z: number) => TERM.cz - (z - 13.5);
  const T = {
    sobre: (k: string, x: number, z: number, w: number, h: number, d: number, hex: string, dy = 0) => sobre(k, X(x), Z(z), w, h, d, hex, dy),
    caixa: (k: string, x: number, y: number, z: number, w: number, h: number, d: number, hex: string) => c.caixa(k, X(x), y, Z(z), w, h, d, hex),
    marca: (x: number, z: number, w: number, d: number, hex: string, k: string) => marca(X(x), Z(z), w, d, hex, k),
  };
  c.caixa("edif", TERM.cx, P / 2, TERM.cz, 9.9, P, 2.4, "#dfe6ee");
  passo(-4.5, 4.5, 1).forEach(x => T.marca(x, 13.5, 0.01, 2.4, "#b9c4d1", "edif"));
  passo(12.6, 14.4, 0.6).forEach(z => T.marca(0, z, 9.9, 0.01, "#b9c4d1", "edif"));
  passo(-4.75, 4.75, 0.5).filter(x => Math.abs(x) > 0.65).forEach(x => [12.3, 14.7].forEach(z => T.caixa("edif", x, 0.42, z, 0.014, 0.6, 0.014, "#c9d3e0")));
  passo(-4.5, 4.5, 1).forEach(x => [12.8, 13.5, 14.2].forEach(z => T.caixa("basico", x, 0.685, z, 0.55, 0.01, 0.09, "#fff2d6")));
  [-1.4, -2.3, -3.2, -4.1].forEach(x => {
    T.sobre("edif", x, 14.35, 0.7, 0.09, 0.2, "#f2f5f9"); T.sobre("edif", x, 14.35, 0.72, 0.006, 0.22, "#087BFF", 0.09);
    T.sobre("basico", x, 14.305, 0.12, 0.08, 0.012, "#2b8fff", 0.07); T.caixa("basico", x, 0.38, 14.35, 0.4, 0.05, 0.012, "#087BFF");
  });
  passo(-1.2, -4.2, -0.4).forEach((x, i, a) => { T.sobre("edif", x, 14.02, 0.01, 0.05, 0.01, "#8a95a5"); if (i < a.length - 1) T.sobre("edif", x - 0.2, 14.02, 0.4, 0.006, 0.004, "#c0392b", 0.04); });
  [-0.33, 0.33].forEach(x => { [-0.08, 0.08].forEach(dx => T.sobre("edif", x + dx, 13.6, 0.02, 0.2, 0.03, "#c9d3e0")); T.sobre("edif", x, 13.6, 0.18, 0.02, 0.03, "#c9d3e0", 0.2); T.caixa("basico", x, P + 0.222, 13.6, 0.06, 0.012, 0.02, "#1fe27a"); });
  T.sobre("edif", -0.7, 13.6, 0.3, 0.08, 0.14, "#3a4352");
  passo(1.3, 4.5, 0.24).forEach(x => { T.sobre("edif", x, 12.72, 0.2, 0.05, 0.16, "#3d5f9c"); T.sobre("edif", x, 12.795, 0.2, 0.08, 0.025, "#2d4b80", 0.05); });
  T.sobre("edif", -3.9, 12.75, 0.7, 0.09, 0.22, "#8a5a3b"); T.sobre("edif", -3.9, 12.75, 0.72, 0.008, 0.24, "#f2f5f9", 0.09); T.caixa("basico", -3.9, 0.22, 12.6, 0.5, 0.1, 0.01, "#ffb24d");
  T.sobre("edif", -2.3, 12.7, 0.6, 0.12, 0.08, "#e9eef5");
  const cores = ["#e4572e", "#f3a712", "#3bb273", "#4d9de0", "#7768ae", "#ff6b9d"];
  for (let i = 0; i < 24; i++) T.sobre("edif", -2.55 + (i % 8) * 0.07, 12.7, 0.04, 0.035, 0.04, cores[i % 6], 0.12 + Math.floor(i / 8) * 0.045);
  [[-4.8, 12.5], [4.8, 12.5], [-4.8, 14.55], [4.8, 14.55], [0, 13.0]].forEach(([x, z]) => { c.cil("edif", X(x), P + 0.03, Z(z), 0.05, 0.04, 0.06, "#e9eef5"); c.esf("edif", X(x), P + 0.11, Z(z), 0.07, "#2f8f4e", 6); });
  T.sobre("edif", 0, 15.0, 3.2, 0.04, 0.9, "#e9eef5", 0.48); [-1.5, 1.5].forEach(x => c.cil("edif", X(x), 0.25, Z(15.3), 0.02, 0.02, 0.5, "#aab4c3", 6));

  /* torre de controle (como na foto, ao lado do terminal) */
  const TO = rect("torre");
  c.cil("edif", TO.cx, 1.2, TO.cz, 0.12, 0.18, 2.4, "#d7dfea", 12);
  c.cil("basico", TO.cx, 2.5, TO.cz, 0.38, 0.28, 0.3, "#9fd2ff", 12);
  c.cone("edif", TO.cx, 2.78, TO.cz, 0.42, 0.18, "#e9eef5", 12);

  /* ---------- hangares arqueados (interior) ---------- */
  const hangar = (h: Ret, paredes: Caixa[]) => {
    const wallH = 0.35, esc = 0.22;
    paredes.forEach(b => c.caixa("hangar", (b.x0 + b.x1) / 2, wallH / 2, (b.z0 + b.z1) / 2, b.x1 - b.x0, wallH, b.z1 - b.z0, "#8d9bb0"));
    arcoFaixas(c, h, wallH, esc); empena(c, h, true, wallH, esc); empena(c, h, false, wallH, esc);
    c.caixa("edif", h.cx, P / 2, h.cz, h.w - 0.1, P, h.d - 0.1, "#aab0b8");
    [0, 1, 2].forEach(i => sobre("edif", h.cx - h.w / 2 + 0.5 + i * 0.35, h.cz - h.d / 2 + 0.25, 0.3, 0.2, 0.16, "#c0392b"));
    sobre("edif", h.cx + h.w / 2 - 0.4, h.cz - h.d / 2 + 0.6, 0.16, 0.1, 0.6, "#6b4a2b");
    [0, 0.04, 0.08].forEach(dy => c.cil("edif", h.cx + h.w / 2 - 0.4, P + 0.02 + dy, h.cz + 0.6, 0.06, 0.06, 0.04, "#16181c", 10));
    c.caixa("edif", h.cx, 0.62, h.cz, 0.05, 0.025, h.d - 0.4, "#e0a800");
    passo(-1.5, 1.5, 1.5).forEach(dx => passo(-h.d / 2 + 0.6, h.d / 2 - 0.6, 1.0).forEach(dz => c.caixa("basico", h.cx + dx, 0.6, h.cz + dz, 0.08, 0.01, 0.4, "#fff0d0")));
  };
  hangar(H1, PAREDES_H1); hangar(H2, PAREDES_H2);

  /* ---------- galpão (dentes de serra), oficina e prédios de telhado alto ---------- */
  const GA = rect("galpao");
  sobre("edif", GA.cx, GA.cz, GA.w, 0.4, GA.d, "#cfd6e0");
  const dentes = 5, dd = GA.d / dentes;
  for (let i = 0; i < dentes; i++) {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(dd, 0); s.lineTo(dd, 0.22); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: GA.w, bevelEnabled: false, curveSegments: 1 });
    g.translate(0, 0, -GA.w / 2); g.rotateY(Math.PI / 2); g.translate(GA.cx, P + 0.4, GA.cz - GA.d / 2 + (i + 1) * dd);
    c.geo("edif", g, "#3b414a");
  }
  const OF = rect("oficina");
  sobre("edif", OF.cx, OF.cz, OF.w, 0.38, OF.d, "#d3d9e2"); sobre("edif", OF.cx, OF.cz, OF.w + 0.1, 0.05, OF.d + 0.1, "#3b414a", 0.38);
  passo(-2.2, 2.2, 1.1).forEach(dx => sobre("edif", OF.cx + dx, OF.cz, 0.35, 0.1, 0.35, "#9aa3af", 0.43));
  const PR = rect("predios");
  const telhado = (cx: number, cz: number, w: number, d: number) => {
    sobre("edif", cx, cz, w, 0.3, d, "#e2e7ee");
    const g = new THREE.ConeGeometry(1, 1, 4); g.rotateY(Math.PI / 4); g.scale(w / Math.SQRT2 * 1.06, 0.2, d / Math.SQRT2 * 1.06); g.translate(cx, P + 0.3 + 0.1, cz);
    c.geo("edif", g, "#8a929f");
  };
  telhado(PR.cx - 1.9, PR.cz, 2.75, 1.75); telhado(PR.cx + 1.9, PR.cz, 3.0, 1.75);

  /* ---------- cascas que ficam transparentes quando o jogador entra ---------- */
  PAREDES_TERMINAL.forEach((b, i) => {
    const w = b.x1 - b.x0, d = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    if (i >= 4) c.caixa("casca", cx, 0.36, cz, w, 0.72, d, "#16263d");
    else { c.caixa("casca", cx, 0.06, cz, w, 0.12, d, "#16263d"); c.caixa("vidro", cx, 0.42, cz, w, 0.6, d * 0.5, "#8fc4ff"); }
  });
  c.caixa("casca", TERM.cx, 0.74, TERM.cz + 0.1, 10.7, 0.07, 3.1, "#e9eef5");
  c.caixa("casca", TERM.cx, 0.69, TERM.cz, 9.8, 0.012, 2.3, "#dfe6ee");

  /* ---------- relevo (só no modo real) e árvores (como na maquete: bordas densas, miolo esparso) ---------- */
  const r = rng(7);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + r() * 0.3, d = 150 + r() * 60, h = 14 + r() * 20, raio = 28 + r() * 24;
    c.cone("montanhas", Math.cos(a) * d, h / 2 - 1, Math.sin(a) * d, raio, h, r() < 0.5 ? "#15283d" : "#1c374b", 7);
  }
  const distSeg = (px: number, pz: number, a: P2, b: P2) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
  };
  const livre = (mx: number, mz: number) => {
    if (ELEMENTOS.some(e => { if (e.tipo === "rede") return false; const b = caixaDe(e); return mx > b.x0 - 22 && mx < b.x1 + 22 && mz > b.z0 - 22 && mz < b.z1 + 22; })) return false;
    if (TAXIS.some(t => t.pts.slice(1).some((q, i) => distSeg(mx, mz, t.pts[i], q) < LARG_TAXI / 2 + 14))) return false;
    if (mx > 296 && mx < 404) return false;                                       // faixa da pista
    if (Math.abs(mx - -40) < 28 && mz < -200) return false;                       // via de acesso
    if (distSeg(mx, mz, [-360, 380], [-380, 215]) < 24) return false;            // estrada de serviço
    return true;
  };
  const tr = new Construtor();
  tr.cil("a", 0, 0.08, 0, 0.035, 0.045, 0.16, "#4a3524", 5); tr.esf("a", 0, 0.34, 0, 0.26, "#2e7a45", 7); tr.esf("a", 0.08, 0.5, 0.05, 0.19, "#3a8f52", 7);
  const arvoresGeo = tr.pronto("a", false)!;
  const arvores: THREE.Matrix4[] = [], tons: string[] = [];
  for (let n = 0; n < 30000 && arvores.length < 420; n++) {
    const mx = TERRENO.x[0] + 12 + r() * (TERRENO.x[1] - TERRENO.x[0] - 24), mz = TERRENO.z[0] + 12 + r() * (TERRENO.z[1] - TERRENO.z[0] - 24);
    if (!livre(mx, mz)) continue;
    const borda = Math.min(mx - TERRENO.x[0], TERRENO.x[1] - mx, mz - TERRENO.z[0], TERRENO.z[1] - mz) < 90;
    if (r() > (borda ? 0.9 : 0.1)) continue;
    const s = 0.7 + r() * 0.8;
    arvores.push(new THREE.Matrix4().compose(new THREE.Vector3(u(mx), 0, u(mz)), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6), new THREE.Vector3(s, s, s)));
    tons.push(["#ffffff", "#e6f2e0", "#d4e8cc", "#f3ffe6", "#c9dfc0"][Math.floor(r() * 5)]);
  }

  /* ---------- luzes (pontos de brilho) ---------- */
  const pq: number[] = [], pqc: number[] = [], gr: number[] = [], grc: number[] = [];
  const lz = (arr: number[], carr: number[], x: number, y: number, z: number, hex: string) => { const k = new THREE.Color(hex); arr.push(x, y, z); carr.push(k.r, k.g, k.b); };
  passo(zn + 0.8, zs - 0.8, 1.5).forEach(z => { lz(pq, pqc, R.cx - 1.55, P + 0.03, z, "#fff1c9"); lz(pq, pqc, R.cx + 1.55, P + 0.03, z, "#fff1c9"); });
  passo(-1.4, 1.4, 0.2).forEach(dx => { lz(pq, pqc, R.cx + dx, P + 0.03, zs + 0.15, "#22ff77"); lz(pq, pqc, R.cx + dx, P + 0.03, zn - 0.15, "#ff3b3b"); });
  passo(1, 11, 1.6).forEach(dz => lz(pq, pqc, R.cx, P + 0.04, zs + dz, "#cfe6ff"));
  taxiEdge.forEach(([x, z]) => lz(pq, pqc, x, P + 0.03, z, "#ffe08a"));
  [-0.6, -0.2].forEach(dx => lz(pq, pqc, R.cx + dx - 3, P + 0.04, zs - 6, "#ff3b3b")); [0.2, 0.6].forEach(dx => lz(pq, pqc, R.cx + dx - 3, P + 0.04, zs - 6, "#ffffff"));
  mastrosM.forEach(([mx, mz]) => lz(gr, grc, u(mx), 1.04, u(mz), "#fff0c8"));
  lz(gr, grc, TO.cx, 2.9, TO.cz, "#ff5a4a"); lz(gr, grc, H1.cx, 0.4, H1.cz + H1.d / 2, "#ffe2b0"); lz(gr, grc, H2.cx, 0.4, H2.cz + H2.d / 2, "#ffe2b0");
  [[-40, -380], [-360, 380]].forEach(([mx, mz]) => lz(gr, grc, u(mx), 0.3, u(mz), "#ffd89a"));

  const pronto = (k: string, uv = true) => c.pronto(k, uv);
  return {
    chao: pronto("chao")!, externo: pronto("externo")!, edif: pronto("edif")!, basico: pronto("basico", false)!, casca: pronto("casca", false)!, vidro: pronto("vidro", false)!,
    hangar: pronto("hangar", false)!, montanhas: pronto("montanhas", false)!, arvoresGeo, arvores, tons,
    luzesP: { pos: new Float32Array(pq), cor: new Float32Array(pqc) }, luzesG: { pos: new Float32Array(gr), cor: new Float32Array(grc) },
  };
}
export type Mundo = ReturnType<typeof criarMundo>;
