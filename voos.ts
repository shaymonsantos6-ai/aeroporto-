// Simulação ILUSTRATIVA de voos. Rotas, horários e números de voo são FICTÍCIOS.
const T0 = typeof performance !== "undefined" ? performance.now() : 0;
export const agora = () => (performance.now() - T0) / 1000; // relógio compartilhado (3D + mapa)

export const CICLO_DEC = 38, OFF_DEC = 8;   // ciclo da decolagem na cena 3D
export const CICLO_POU = 46, OFF_POU = 20;  // ciclo do pouso na cena 3D
export const DUR = 34;                      // duração (s) de um voo no mapa

export type Cidade = { cod: string; nome: string; lat: number; lon: number };
export const CIDADES: Cidade[] = [
  { cod: "TCH", nome: "Brasília (Os Tchutchucos)", lat: -15.86, lon: -47.92 },
  { cod: "GRU", nome: "São Paulo", lat: -23.43, lon: -46.47 },
  { cod: "CNF", nome: "Belo Horizonte", lat: -19.62, lon: -43.97 },
  { cod: "GIG", nome: "Rio de Janeiro", lat: -22.81, lon: -43.25 },
  { cod: "SSA", nome: "Salvador", lat: -12.91, lon: -38.33 },
  { cod: "REC", nome: "Recife", lat: -8.13, lon: -34.92 },
  { cod: "FOR", nome: "Fortaleza", lat: -3.78, lon: -38.53 },
  { cod: "MAO", nome: "Manaus", lat: -3.04, lon: -60.05 },
  { cod: "BEL", nome: "Belém", lat: -1.38, lon: -48.48 },
  { cod: "CWB", nome: "Curitiba", lat: -25.53, lon: -49.18 },
  { cod: "POA", nome: "Porto Alegre", lat: -29.99, lon: -51.17 },
  { cod: "CGB", nome: "Cuiabá", lat: -15.65, lon: -56.12 },
];
export const nomeCidade = (cod: string) => CIDADES.find(c => c.cod === cod)?.nome.split(" (")[0] ?? cod;
const cid = (cod: string) => CIDADES.find(c => c.cod === cod)!;

export const DESTINOS = ["GRU", "CNF", "GIG", "SSA", "POA", "REC", "FOR", "MAO", "CWB", "CGB", "BEL"];
export const ORIGENS = ["GIG", "GRU", "CNF", "SSA", "FOR", "POA", "REC", "CWB", "BEL", "CGB"];
export const REDE = [
  { a: "CNF", b: "GIG", periodo: 52, dur: 26, off: 0 }, { a: "GRU", b: "POA", periodo: 61, dur: 30, off: 14 },
  { a: "REC", b: "FOR", periodo: 47, dur: 22, off: 7 }, { a: "SSA", b: "CNF", periodo: 66, dur: 30, off: 33 },
  { a: "CWB", b: "GRU", periodo: 44, dur: 20, off: 21 }, { a: "MAO", b: "BEL", periodo: 70, dur: 34, off: 40 },
  { a: "GIG", b: "SSA", periodo: 58, dur: 30, off: 9 }, { a: "CGB", b: "GRU", periodo: 64, dur: 32, off: 26 },
];

const mod = (a: number, n: number) => ((a % n) + n) % n;
export const numeroSaida = (k: number) => `TCH ${100 + mod(k, 90)}`;
export const destinoSaida = (k: number) => DESTINOS[mod(k, DESTINOS.length)];
export const numeroChegada = (k: number) => `TCH ${300 + mod(k, 90)}`;
export const origemChegada = (k: number) => ORIGENS[mod(k, ORIGENS.length)];

export type Voo = { id: string; num: string; de: string; para: string; p: number; tipo: "saida" | "chegada" | "rede" };

export function voosAtivos(t: number): Voo[] {
  const r: Voo[] = [];
  const kd = Math.floor((t + OFF_DEC) / CICLO_DEC);
  for (let k = kd - 2; k <= kd + 1; k++) {
    const tD = k * CICLO_DEC - OFF_DEC + 0.5 * CICLO_DEC;
    if (t >= tD && t < tD + DUR) r.push({ id: `s${k}`, num: numeroSaida(k), de: "TCH", para: destinoSaida(k), p: (t - tD) / DUR, tipo: "saida" });
  }
  const kp = Math.floor((t + OFF_POU) / CICLO_POU);
  for (let k = kp - 2; k <= kp + 2; k++) {
    const tA = k * CICLO_POU - OFF_POU + 0.28 * CICLO_POU;
    if (t >= tA - DUR && t < tA) r.push({ id: `c${k}`, num: numeroChegada(k), de: origemChegada(k), para: "TCH", p: (t - (tA - DUR)) / DUR, tipo: "chegada" });
  }
  REDE.forEach((f, i) => {
    const u = mod(t + f.off, f.periodo);
    if (u < f.dur) r.push({ id: `r${i}-${Math.floor((t + f.off) / f.periodo)}`, num: `TCH ${200 + i * 7}`, de: f.a, para: f.b, p: u / f.dur, tipo: "rede" });
  });
  return r;
}

const suave = (x: number) => x * x * (3 - 2 * x);
export function posicaoVoo(v: Voo) {
  const a = cid(v.de), b = cid(v.para), f = suave(Math.min(1, Math.max(0, v.p)));
  return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
}

// Projeção equirretangular simples para uma caixa 0..100
export const proj = (lat: number, lon: number): [number, number] => [((lon + 74) / 40) * 100, ((5.5 - lat) / 39.5) * 100];

// Contorno MUITO simplificado do Brasil (esquemático)
export const CONTORNO: [number, number][] = [
  [5.2, -60.0], [4.2, -64.0], [1.8, -67.0], [1.0, -69.9], [-4.2, -70.0], [-4.5, -73.0], [-9.5, -72.5], [-11.0, -70.5], [-9.8, -65.3],
  [-12.5, -65.0], [-13.5, -60.5], [-16.3, -58.5], [-20.0, -58.2], [-22.0, -57.8], [-24.0, -55.5], [-25.6, -54.3], [-27.2, -53.7],
  [-30.2, -57.6], [-33.7, -53.4], [-32.0, -52.0], [-28.5, -48.6], [-26.0, -48.5], [-25.0, -48.0], [-23.2, -44.7], [-22.0, -41.0],
  [-19.0, -40.0], [-16.0, -39.0], [-13.0, -38.5], [-11.0, -37.0], [-6.5, -35.2], [-5.2, -35.4], [-4.9, -37.2], [-2.8, -40.0],
  [-2.5, -44.0], [-1.0, -48.5], [0.0, -50.0], [4.0, -51.0],
];
