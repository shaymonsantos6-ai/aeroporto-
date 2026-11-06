import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { colorir } from "./construtor";

const ni = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);

function extrudar(pts: [number, number][], esp: number) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: false });
  g.translate(0, 0, -esp / 2);
  return g;
}

function espelharZ(g0: THREE.BufferGeometry) {
  const g = ni(g0.clone());
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) { pos.setZ(i, -pos.getZ(i)); nor.setZ(i, -nor.getZ(i)); }
  for (let i = 0; i < pos.count; i += 3) {
    for (const a of [pos, nor]) { const x = a.getX(i + 1), y = a.getY(i + 1), z = a.getZ(i + 1); a.setXYZ(i + 1, a.getX(i + 2), a.getY(i + 2), a.getZ(i + 2)); a.setXYZ(i + 2, x, y, z); }
    if (uv) { const x = uv.getX(i + 1), y = uv.getY(i + 1); uv.setXY(i + 1, uv.getX(i + 2), uv.getY(i + 2)); uv.setXY(i + 2, x, y); }
  }
  return g;
}

export type Aviao3D = { corpo: THREE.BufferGeometry; trem: THREE.BufferGeometry; decal: THREE.BufferGeometry; luzes: { pos: number[]; cor: number[] } };
const CACHE = new Map<string, Aviao3D>();

export function criarAviao(tipo: "jato" | "turbo", corpoHex: string, caudaHex: string): Aviao3D {
  const chave = `${tipo}|${corpoHex}|${caudaHex}`, hit = CACHE.get(chave);
  if (hit) return hit;
  const turbo = tipo === "turbo", R = 0.13;
  const partes: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, hex: string, m?: THREE.Matrix4) => { const q = ni(g.clone()); if (m) q.applyMatrix4(m); colorir(q, hex); partes.push(q); return q; };
  const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);

  const perfil = [[0, -1.12], [0.02, -1.1], [0.05, -1.0], [0.08, -0.85], [0.108, -0.65], [R, -0.45], [R, 0.7], [0.125, 0.82], [0.11, 0.95], [0.08, 1.07], [0.04, 1.13], [0, 1.15]].map(([r, y]) => new THREE.Vector2(r, y));
  const pts = new THREE.SplineCurve(perfil).getPoints(60).map(p => new THREE.Vector2(Math.max(0, p.x), p.y));
  const fus = new THREE.LatheGeometry(pts, 24); fus.rotateZ(-Math.PI / 2);
  add(fus, corpoHex, new THREE.Matrix4().makeScale(turbo ? 0.82 : 1, 1, 1));
  add(new THREE.BoxGeometry(turbo ? 0.8 : 1.15, 0.022, 0.262), "#0d1520", T(0.05, 0.045, 0));
  add(new THREE.BoxGeometry(0.09, 0.04, 0.236), "#0a1018", T(turbo ? 0.68 : 0.86, 0.075, 0));
  add(new THREE.BoxGeometry(turbo ? 0.9 : 1.3, 0.018, 0.264), caudaHex, T(0.05, -0.02, 0));

  const asa = turbo ? extrudar([[0.16, 0], [0.1, -1.25], [-0.1, -1.25], [-0.16, 0]], 0.03) : extrudar([[0.3, 0], [-0.3, -1.05], [-0.55, -1.05], [-0.2, 0]], 0.028);
  asa.rotateX(-Math.PI / 2);
  const mAsa = T(turbo ? 0.05 : 0.08, turbo ? 0.1 : -0.08, 0).multiply(new THREE.Matrix4().makeRotationX(-0.05));
  const asaD = add(asa, corpoHex, mAsa); partes.push(colorir(espelharZ(asaD), corpoHex));

  if (!turbo) for (const s of [1, -1]) add(new THREE.BoxGeometry(0.14, 0.15, 0.012), caudaHex, T(-0.47, 0, s * 1.03).multiply(new THREE.Matrix4().makeRotationZ(0.35)));
  const nac = new THREE.LatheGeometry([[0.02, -0.2], [0.065, -0.19], [0.08, -0.1], [0.082, 0.1], [0.09, 0.185], [0.07, 0.2]].map(([r, y]) => new THREE.Vector2(r, y)), 16); nac.rotateZ(-Math.PI / 2);
  const disco = new THREE.CircleGeometry(0.066, 12); disco.rotateY(Math.PI / 2); disco.translate(0.19, 0, 0);
  for (const s of [1, -1]) {
    const p = turbo ? T(0.12, 0.08, s * 0.5).multiply(new THREE.Matrix4().makeScale(0.8, 0.8, 0.8)) : T(0.14, -0.175, s * 0.4);
    add(nac, "#aab6c6", p); add(disco, "#05080c", p);
    if (!turbo) add(new THREE.BoxGeometry(0.22, 0.09, 0.03), corpoHex, T(0.12, -0.075, s * 0.4));
    else { add(new THREE.BoxGeometry(0.012, 0.34, 0.03), "#1b1f26", T(0.38, 0.08, s * 0.5)); add(new THREE.BoxGeometry(0.012, 0.03, 0.34), "#1b1f26", T(0.38, 0.08, s * 0.5)); }
  }
  const est = extrudar([[-0.8, 0], [-0.98, -0.38], [-1.08, -0.38], [-0.98, 0]], 0.02); est.rotateX(-Math.PI / 2);
  const estD = add(est, corpoHex, T(0, 0.06, 0)); partes.push(colorir(espelharZ(estD), corpoHex));
  add(extrudar([[-0.55, 0.1], [-0.86, 0.56], [-1.0, 0.56], [-1.0, 0.1]], 0.03), caudaHex);
  const corpo = mergeGeometries(partes, false)!;

  const tp: THREE.BufferGeometry[] = [];
  const addT = (g: THREE.BufferGeometry, hex: string, x: number, y: number, z: number) => { const q = ni(g.clone()); q.translate(x, y, z); colorir(q, hex); tp.push(q); };
  const roda = new THREE.CylinderGeometry(0.03, 0.03, 0.025, 10); roda.rotateX(Math.PI / 2);
  addT(new THREE.BoxGeometry(0.016, 0.17, 0.016), "#9aa6b6", 0.72, -0.17, 0); addT(roda, "#15181d", 0.72, -0.235, 0.022); addT(roda, "#15181d", 0.72, -0.235, -0.022);
  for (const s of [1, -1]) { addT(new THREE.BoxGeometry(0.02, 0.17, 0.02), "#9aa6b6", -0.05, -0.17, s * 0.18); addT(roda, "#15181d", -0.05, -0.235, s * 0.18 + 0.026); addT(roda, "#15181d", -0.05, -0.235, s * 0.18 - 0.026); }
  const trem = mergeGeometries(tp, false)!;

  const d1 = new THREE.PlaneGeometry(0.19, 0.17); d1.translate(-0.82, 0.33, 0.0165);
  const d2 = new THREE.PlaneGeometry(0.19, 0.17); d2.rotateY(Math.PI); d2.translate(-0.82, 0.33, -0.0165);
  const decal = mergeGeometries([d1, d2], false)!;

  const lx = turbo ? -0.1 : -0.29, ly = turbo ? 0.12 : -0.04, lz = turbo ? 1.2 : 1.07;
  const luzes = { pos: [lx, ly, lz, lx, ly, -lz, -1.1, 0.06, 0, 0, 0.15, 0], cor: [0.1, 1, 0.3, 1, 0.15, 0.15, 1, 1, 1, 1, 1, 1] };
  const r = { corpo, trem, decal, luzes };
  CACHE.set(chave, r);
  return r;
}
