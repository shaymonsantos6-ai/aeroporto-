// Obstáculos do modo "explorar a pé" (unidades da cena: 1 un = 20 m).
import { S, porId } from "./dados";
import { PARADOS } from "./layout";

export type Caixa = { x0: number; x1: number; z0: number; z1: number };
export type Ret = { cx: number; cz: number; w: number; d: number };
const caixa = (cx: number, cz: number, w: number, d: number): Caixa => ({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
const T = 0.08, PORTA = 0.6, PORTAO = 1.0;

const R = (id: string): Ret => { const e = porId(id)!; return { cx: e.centro[0] * S, cz: e.centro[1] * S, w: e.dim[0] * S, d: e.dim[1] * S }; };
export const TERM = R("terminal"), H1 = R("hangar"), H2 = R("hangar2");

export const BORDAS = { x: [-30, 30] as [number, number], z: [-24, 21] as [number, number] };

// terminal: lado sul = pátio (aeronaves), lado norte = acesso. Portas no centro das duas faces.
function paredesTerminal(t: Ret): Caixa[] {
  const x0 = t.cx - t.w / 2, x1 = t.cx + t.w / 2, zN = t.cz - t.d / 2, zS = t.cz + t.d / 2;
  return [
    { x0, x1: t.cx - PORTA, z0: zS - T, z1: zS }, { x0: t.cx + PORTA, x1, z0: zS - T, z1: zS },
    { x0, x1: t.cx - PORTA, z0: zN, z1: zN + T }, { x0: t.cx + PORTA, x1, z0: zN, z1: zN + T },
    { x0, x1: x0 + T, z0: zN, z1: zS }, { x0: x1 - T, x1, z0: zN, z1: zS },
  ];
}
// hangar arqueado: porta larga na face sul (voltada ao pátio)
function paredesHangar(h: Ret): Caixa[] {
  const x0 = h.cx - h.w / 2, x1 = h.cx + h.w / 2, zN = h.cz - h.d / 2, zS = h.cz + h.d / 2;
  return [
    { x0, x1: h.cx - PORTAO, z0: zS - T, z1: zS }, { x0: h.cx + PORTAO, x1, z0: zS - T, z1: zS },
    { x0, x1, z0: zN, z1: zN + T }, { x0, x1: x0 + T, z0: zN, z1: zS }, { x0: x1 - T, x1, z0: zN, z1: zS },
  ];
}
export const PAREDES_TERMINAL = paredesTerminal(TERM);
export const PAREDES_H1 = paredesHangar(H1);
export const PAREDES_H2 = paredesHangar(H2);

const solido = (id: string): Caixa => { const r = R(id); return caixa(r.cx, r.cz, r.w, r.d); };
export const OBSTACULOS: Caixa[] = [
  ...PAREDES_TERMINAL, ...PAREDES_H1, ...PAREDES_H2,
  caixa(H1.cx, H1.cz, 2.0, 1.7), caixa(H2.cx, H2.cz, 2.0, 1.7),   // aeronaves dentro dos hangares
  solido("torre"), solido("galpao"), solido("oficina"), solido("predios"),
  ...PARADOS.map(p => caixa(p.x, p.z, 2.1, 2.1)),
];

const dentro = (x: number, z: number, r: number) => OBSTACULOS.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r);

export function resolver(x: number, z: number, dx: number, dz: number, r = 0.06): [number, number] {
  let nx = x + dx, nz = z;
  if (dentro(nx, nz, r)) nx = x;
  nz = z + dz;
  if (dentro(nx, nz, r)) nz = z;
  nx = Math.min(BORDAS.x[1], Math.max(BORDAS.x[0], nx));
  nz = Math.min(BORDAS.z[1], Math.max(BORDAS.z[0], nz));
  return [nx, nz];
}

const em = (r: Ret, x: number, z: number, m = 0.1) => Math.abs(x - r.cx) < r.w / 2 + m && Math.abs(z - r.cz) < r.d / 2 + m;
export const dentroTerminal = (x: number, z: number) => em(TERM, x, z);
export const dentroHangar = (x: number, z: number) => em(H1, x, z) || em(H2, x, z);
