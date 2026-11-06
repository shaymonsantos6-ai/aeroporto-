import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { colorir } from "./construtor";

export type TipoCarro = "sedan" | "suv" | "pickup" | "van";
type Pt = [number, number];
type Perfil = { corpo: Pt[]; lado: Pt[]; ws?: [Pt, Pt]; rw?: [Pt, Pt]; rodaR: number; luzY: number };
const L = 0.5;

const PERFIS: Record<TipoCarro, Perfil> = {
  sedan: { corpo: [[-0.5, 0.07], [0.5, 0.07], [0.5, 0.19], [0.44, 0.225], [0.2, 0.255], [0.05, 0.4], [-0.2, 0.4], [-0.34, 0.265], [-0.46, 0.255], [-0.5, 0.21]], lado: [[0.16, 0.27], [0.06, 0.385], [-0.19, 0.385], [-0.31, 0.275]], ws: [[0.2, 0.255], [0.05, 0.4]], rw: [[-0.2, 0.4], [-0.34, 0.265]], rodaR: 0.085, luzY: 0.15 },
  suv: { corpo: [[-0.5, 0.1], [0.5, 0.1], [0.5, 0.24], [0.45, 0.28], [0.28, 0.3], [0.16, 0.46], [-0.42, 0.46], [-0.5, 0.3]], lado: [[0.25, 0.315], [0.15, 0.445], [-0.41, 0.445], [-0.47, 0.32]], ws: [[0.28, 0.3], [0.16, 0.46]], rw: [[-0.42, 0.46], [-0.5, 0.3]], rodaR: 0.1, luzY: 0.2 },
  pickup: { corpo: [[-0.5, 0.1], [0.5, 0.1], [0.5, 0.25], [0.44, 0.29], [0.26, 0.31], [0.12, 0.46], [-0.06, 0.46], [-0.1, 0.31], [-0.5, 0.31]], lado: [[0.23, 0.325], [0.125, 0.445], [-0.045, 0.445], [-0.08, 0.325]], ws: [[0.26, 0.31], [0.12, 0.46]], rw: [[-0.06, 0.46], [-0.1, 0.31]], rodaR: 0.1, luzY: 0.2 },
  van: { corpo: [[-0.5, 0.09], [0.5, 0.09], [0.5, 0.24], [0.42, 0.3], [0.3, 0.5], [-0.48, 0.52], [-0.5, 0.45]], lado: [[0.26, 0.33], [0.2, 0.48], [-0.4, 0.48], [-0.4, 0.33]], ws: [[0.42, 0.3], [0.3, 0.5]], rodaR: 0.09, luzY: 0.18 },
};
const ni = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);

function prisma(pts: Pt[], larg: number, bisel = 0) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  const depth = larg - 2 * bisel;
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bisel > 0, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 1, curveSegments: 1 });
  g.translate(0, 0, -depth / 2);
  return g;
}
function painel([a, b]: [Pt, Pt], w: number) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  const g = new THREE.BoxGeometry(len * 0.92, 0.006, w);
  g.rotateZ(Math.atan2(dy, dx));
  g.translate((a[0] + b[0]) / 2 + (dy / len) * 0.004, (a[1] + b[1]) / 2 + (-dx / len) * 0.004, 0);
  return g;
}
const cx = (w: number, h: number, d: number, x: number, y: number, z: number, hex: string) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return colorir(ni(g), hex); };

export type Carro = { corpo: THREE.BufferGeometry; rodas: THREE.BufferGeometry; lumes: THREE.BufferGeometry; locais: THREE.Matrix4[] };
const CACHE = new Map<TipoCarro, Carro>();

// corpo = carroceria (branca, recebe a cor da instância) + vidros (escuros)
export function criarCarro(t: TipoCarro): Carro {
  const hit = CACHE.get(t);
  if (hit) return hit;
  const p = PERFIS[t];
  const partes = [colorir(ni(prisma(p.corpo, L, 0.012)), "#ffffff"), colorir(ni(prisma(p.lado, L + 0.006)), "#0a1018")];
  if (p.ws) partes.push(colorir(ni(painel(p.ws, L * 0.84)), "#0a1018"));
  if (p.rw) partes.push(colorir(ni(painel(p.rw, L * 0.84)), "#0a1018"));
  const corpo = mergeGeometries(partes, false)!;
  const lumes = mergeGeometries([
    cx(0.014, 0.035, 0.08, 0.5, p.luzY, 0.17, "#fff3c4"), cx(0.014, 0.035, 0.08, 0.5, p.luzY, -0.17, "#fff3c4"),
    cx(0.014, 0.03, 0.1, -0.5, p.luzY + 0.01, 0.17, "#ff2a1a"), cx(0.014, 0.03, 0.1, -0.5, p.luzY + 0.01, -0.17, "#ff2a1a"),
  ], false)!;
  const r = p.rodaR, w = 0.09;
  const pneu = new THREE.CylinderGeometry(r, r, w, 12); pneu.rotateX(Math.PI / 2);
  const aro = new THREE.CylinderGeometry(r * 0.6, r * 0.6, w + 0.006, 10); aro.rotateX(Math.PI / 2);
  const rodas = mergeGeometries([colorir(ni(pneu), "#101215"), colorir(ni(aro), "#c9d1db")], false)!;
  const locais: THREE.Matrix4[] = [];
  for (const x of [0.31, -0.31]) for (const z of [0.235, -0.235]) locais.push(new THREE.Matrix4().makeTranslation(x, r, z));
  const c = { corpo, rodas, lumes, locais };
  CACHE.set(t, c);
  return c;
}
