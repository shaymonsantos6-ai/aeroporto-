import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Altura do topo de TODO piso caminhável (pistas, pátio, ruas, pisos internos).
// Pessoas, carros e aviões apoiam os pés/rodas exatamente aqui: nada afunda.
export const CHAO = 0.016;

export function colorir(g: THREE.BufferGeometry, hex: string) {
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}
export const plano = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);

// UV por posição no mundo (permite uma textura de detalhe sem esticar)
export function uvMundo(g: THREE.BufferGeometry, esc = 0.35) {
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    uv[i * 2] = (x + z * 0.7) * esc; uv[i * 2 + 1] = (y * 2 + x * 0.3 - z * 0.5) * esc;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

// Acumula caixas/cilindros coloridos e funde tudo por "chave" em UMA geometria (1 chamada de desenho).
export class Construtor {
  private m = new Map<string, THREE.BufferGeometry[]>();
  geo(k: string, g: THREE.BufferGeometry, hex: string) {
    const q = plano(g); colorir(q, hex);
    const l = this.m.get(k); if (l) l.push(q); else this.m.set(k, [q]);
    return this;
  }
  caixa(k: string, cx: number, cy: number, cz: number, w: number, h: number, d: number, hex: string, rotY = 0) {
    const g = new THREE.BoxGeometry(w, h, d); if (rotY) g.rotateY(rotY); g.translate(cx, cy, cz); return this.geo(k, g, hex);
  }
  cil(k: string, cx: number, cy: number, cz: number, rt: number, rb: number, h: number, hex: string, seg = 10) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(cx, cy, cz); return this.geo(k, g, hex);
  }
  cone(k: string, cx: number, cy: number, cz: number, r: number, h: number, hex: string, seg = 6) {
    const g = new THREE.ConeGeometry(r, h, seg); g.translate(cx, cy, cz); return this.geo(k, g, hex);
  }
  esf(k: string, cx: number, cy: number, cz: number, r: number, hex: string, seg = 8) {
    const g = new THREE.SphereGeometry(r, seg, seg - 2); g.translate(cx, cy, cz); return this.geo(k, g, hex);
  }
  pronto(k: string, uv = true): THREE.BufferGeometry | null {
    const l = this.m.get(k);
    if (!l || !l.length) return null;
    const g = mergeGeometries(l, false);
    if (!g) throw new Error("Falha ao fundir geometrias: " + k);
    return uv ? uvMundo(g) : g;
  }
}
