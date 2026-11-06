import { S } from "./dados";
import type { P2 } from "./trajeto";

export type Parado = { x: number; z: number; rot: number; tipo: "jato" | "turbo"; cauda: string; escala: number };
// Aeronaves paradas (unidades da cena). rot = rotação em Y (o nariz aponta para (cos rot, -sin rot)).
export const PARADOS: Parado[] = [
  { x: -3, z: -3, rot: 2.4, tipo: "jato", cauda: "#087BFF", escala: 0.9 },       // pátio principal
  { x: 1.5, z: -5.5, rot: Math.PI, tipo: "jato", cauda: "#8BCBFF", escala: 0.9 },
  { x: 9.75, z: -7, rot: 2.6, tipo: "jato", cauda: "#0a4fb3", escala: 0.9 },     // pátio norte
];
// Pontos de embarque dos passageiros, ao lado de cada aeronave (unidades)
export const STANDS: P2[] = [[-2.2, -2.3], [2.3, -4.8], [9.2, -6.4]];

export const SPAWN = { x: -2, z: -12.6 };
export const PISTA_X = 17.5;     // eixo da pista (x, unidades)
export const PISTA_Z0 = -18;     // cabeceira norte (z)
export const PISTA_Z1 = 17;      // cabeceira sul (z)

// Trajeto do avião que pousa: rolagem na pista, saída pelo táxi Alfa e parada no pátio (metros -> unidades)
export const POUSO_M: P2[] = [[350, 280], [350, 40], [348, -20], [330, -36], [320, -40], [240, -30], [160, 0], [100, 35], [30, 45], [-30, 40]];
export const POUSO: P2[] = POUSO_M.map(p => [p[0] * S, p[1] * S]);
