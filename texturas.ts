import * as THREE from "three";

function semente(s: number) { let v = s >>> 0; return () => ((v = (v * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function ruido(base: string, variacao = 0.15, tam = 128, pontos = 3500): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = c.height = tam;
  const g = c.getContext("2d")!;
  g.fillStyle = base; g.fillRect(0, 0, tam, tam);
  const r = semente(12345);
  for (let i = 0; i < pontos; i++) {
    const v = (r() - 0.5) * variacao;
    g.fillStyle = v > 0 ? `rgba(255,255,255,${Math.abs(v)})` : `rgba(0,0,0,${Math.abs(v)})`;
    g.fillRect(r() * tam, r() * tam, 1 + r() * 2, 1 + r() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// Brilho circular (usado nas luzes de pista, postes e aeronaves)
let GLOW: THREE.CanvasTexture | null = null;
export function brilho(): THREE.CanvasTexture {
  if (GLOW) return GLOW;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.7)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  GLOW = new THREE.CanvasTexture(c);
  return GLOW;
}
const MATS = new Map<string, THREE.PointsMaterial>();
export function matBrilho(tam: number): THREE.PointsMaterial {
  const k = String(tam), m = MATS.get(k);
  if (m) return m;
  const n = new THREE.PointsMaterial({ size: tam, sizeAttenuation: true, vertexColors: true, map: brilho(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  MATS.set(k, n);
  return n;
}
