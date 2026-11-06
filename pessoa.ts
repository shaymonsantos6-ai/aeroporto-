import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { colorir } from "./construtor";

const ni = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);
const L = 0.065, TH = 0.4;
const HIP = L * Math.cos(TH) + 0.005;   // quadril: os pés tocam y = 0 nas duas poses

// Duas poses de caminhada (A e B). Corpo branco/escuro: a cor da roupa vem da instância.
function pose(sinal: number) {
  const p: THREE.BufferGeometry[] = [];
  const peca = (g: THREE.BufferGeometry, hex: string, m: THREE.Matrix4) => { const q = ni(g); q.applyMatrix4(m); p.push(colorir(q, hex)); };
  const rz = (a: number) => new THREE.Matrix4().makeRotationZ(a);
  const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
  const perna = new THREE.BoxGeometry(0.02, L, 0.02); perna.translate(0, -L / 2, 0);
  const braco = new THREE.BoxGeometry(0.014, 0.055, 0.014); braco.translate(0, -0.0275, 0);
  peca(perna.clone(), "#2a2f3c", T(0, HIP, -0.013).multiply(rz(sinal * TH)));
  peca(perna.clone(), "#2a2f3c", T(0, HIP, 0.013).multiply(rz(-sinal * TH)));
  peca(new THREE.BoxGeometry(0.03, 0.06, 0.05), "#ffffff", T(0, HIP + 0.03, 0));
  peca(braco.clone(), "#ffffff", T(0, HIP + 0.057, -0.032).multiply(rz(-sinal * TH * 0.9)));
  peca(braco.clone(), "#ffffff", T(0, HIP + 0.057, 0.032).multiply(rz(sinal * TH * 0.9)));
  return mergeGeometries(p, false)!;
}
export type PessoaGeo = { A: THREE.BufferGeometry; B: THREE.BufferGeometry; cabeca: THREE.BufferGeometry; mala: THREE.BufferGeometry };
let CACHE: PessoaGeo | null = null;
export function criarPessoa(): PessoaGeo {
  if (CACHE) return CACHE;
  const h = new THREE.SphereGeometry(0.021, 10, 8); h.translate(0, HIP + 0.081, 0);
  const cabelo = new THREE.SphereGeometry(0.0228, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); cabelo.translate(0, HIP + 0.085, 0);
  const cabeca = mergeGeometries([colorir(ni(h), "#ffffff"), colorir(ni(cabelo), "#0d0a08")], false)!;
  const m = new THREE.BoxGeometry(0.02, 0.04, 0.03); m.translate(0, 0.02, 0);
  CACHE = { A: pose(1), B: pose(-1), cabeca, mala: colorir(ni(m), "#ffffff") };
  return CACHE;
}
