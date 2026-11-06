// Fonte de dados compartilhada (3D, planta, orçamento, memorial).
// Layout inspirado na foto de referência da maquete. Valores HIPOTÉTICOS e acadêmicos (metros).
export const S = 1 / 20; // 1 unidade da cena 3D = 20 m

export type Elemento = {
  id: string; nome: string;
  centro: [number, number];   // x (leste), z (sul) em metros
  dim: [number, number];      // extensão em x, extensão em z (m). Para "rede": [comprimento total, largura]
  altura: number;             // m
  cor: string; secaoMemorial: string; tipo?: "rede";
};

export const TERRENO = { x: [-500, 500] as [number, number], z: [-380, 380] as [number, number] };
export const LARG_TAXI = 28;

// Rede de pistas de táxi (polilinhas, em metros). A e B formam o "Y" em direção à pista.
export const TAXIS: { id: string; nome: string; pts: [number, number][] }[] = [
  { id: "A", nome: "Táxi Alfa", pts: [[320, -40], [240, -30], [160, 0], [100, 35]] },
  { id: "B", nome: "Táxi Bravo", pts: [[320, 235], [260, 230], [190, 190], [140, 120], [100, 72]] },
  { id: "C", nome: "Táxi Charlie", pts: [[100, 72], [20, 100], [-120, 120], [-260, 150], [-380, 200]] },
  { id: "T1", nome: "Conexão do pátio norte", pts: [[320, -140], [290, -140]] },
];
const compr = (p: [number, number][]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
export const comprimentoTaxis = () => TAXIS.reduce((s, t) => s + compr(t.pts), 0);

export const ELEMENTOS: Elemento[] = [
  { id: "pista", nome: "Pista de pouso e decolagem", centro: [350, -10], dim: [60, 700], altura: 0.5, cor: "#2a2f38", secaoMemorial: "Geometria da pista" },
  { id: "taxiway", nome: "Pistas de táxi (rede)", centro: [-30, 47.5], dim: [Math.round(comprimentoTaxis()), LARG_TAXI], altura: 0.5, cor: "#3a4350", secaoMemorial: "Pistas de táxi e pátio", tipo: "rede" },
  { id: "patio", nome: "Pátio principal de aeronaves", centro: [-150, -37.5], dim: [500, 225], altura: 0.5, cor: "#4a5565", secaoMemorial: "Pistas de táxi e pátio" },
  { id: "patioN", nome: "Pátio norte", centro: [195, -140], dim: [190, 100], altura: 0.5, cor: "#4a5565", secaoMemorial: "Pistas de táxi e pátio" },
  { id: "terminal", nome: "Terminal de passageiros", centro: [-40, -190], dim: [200, 50], altura: 14, cor: "#8BCBFF", secaoMemorial: "Edificações" },
  { id: "torre", nome: "Torre de controle", centro: [80, -190], dim: [14, 14], altura: 40, cor: "#d7dfea", secaoMemorial: "Edificações" },
  { id: "hangar", nome: "Hangar 1 (arqueado)", centro: [-215, -190], dim: [110, 80], altura: 19, cor: "#A8B7C9", secaoMemorial: "Edificações" },
  { id: "hangar2", nome: "Hangar 2 (arqueado)", centro: [-345, -180], dim: [100, 60], altura: 17, cor: "#A8B7C9", secaoMemorial: "Edificações" },
  { id: "galpao", nome: "Galpão de manutenção", centro: [-440, -250], dim: [110, 70], altura: 10, cor: "#7b8798", secaoMemorial: "Edificações" },
  { id: "oficina", nome: "Oficina e apoio", centro: [-300, -265], dim: [120, 55], altura: 9, cor: "#7b8798", secaoMemorial: "Edificações" },
  { id: "predios", nome: "Prédios administrativos", centro: [230, -305], dim: [150, 45], altura: 7, cor: "#c9d3e0", secaoMemorial: "Edificações" },
  { id: "estacionamento", nome: "Estacionamento", centro: [-100, -272], dim: [80, 55], altura: 0.5, cor: "#182638", secaoMemorial: "Estacionamento e acessos" },
  { id: "acesso", nome: "Via de acesso norte", centro: [-40, -322.5], dim: [14, 215], altura: 0.3, cor: "#222b36", secaoMemorial: "Estacionamento e acessos" },
];

export const DRENAGEM = {
  linhas: [
    [[400, -350], [400, 330], [428, 340]],
    [[300, -350], [300, 200]],
  ] as [number, number][][],
  bacia: { centro: [440, 345] as [number, number], raio: 28 },
};

export const area = (e: Elemento) => e.dim[0] * e.dim[1];
export const areaTerreno = () => (TERRENO.x[1] - TERRENO.x[0]) * (TERRENO.z[1] - TERRENO.z[0]);
export const porId = (id: string) => ELEMENTOS.find(e => e.id === id);
export const comprimentoDrenagem = () => DRENAGEM.linhas.reduce((t, l) => t + compr(l), 0);

// Caixa envolvente em metros (para destaque, câmera, radar). Para a rede de táxi, usa os pontos reais.
export function caixaDe(e: Elemento) {
  if (e.tipo === "rede") {
    const xs = TAXIS.flatMap(t => t.pts.map(p => p[0])), zs = TAXIS.flatMap(t => t.pts.map(p => p[1])), m = LARG_TAXI / 2;
    return { x0: Math.min(...xs) - m, x1: Math.max(...xs) + m, z0: Math.min(...zs) - m, z1: Math.max(...zs) + m };
  }
  return { x0: e.centro[0] - e.dim[0] / 2, x1: e.centro[0] + e.dim[0] / 2, z0: e.centro[1] - e.dim[1] / 2, z1: e.centro[1] + e.dim[1] / 2 };
}

export function medidasDe(e: Elemento): [string, string][] {
  const f = (n: number, u: string, dec = 1) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: dec })} ${u}`;
  const A = area(e), c = Math.max(...e.dim), l = Math.min(...e.dim);
  if (e.tipo === "rede") {
    return [["Ramos da rede", `${TAXIS.length}`], ["Comprimento total", f(c, "m", 0)], ["Largura", f(l, "m")], ["Área (comprimento × largura)", f(A, "m²", 0)], ["% do terreno", `${((A / areaTerreno()) * 100).toFixed(2)} %`]];
  }
  const m: [string, string][] = [["Comprimento", f(c, "m")], ["Largura", f(l, "m")]];
  if (e.altura >= 1) m.push(["Altura", f(e.altura, "m")]);
  m.push(["Área em planta", f(A, "m²", 0)], ["Perímetro", f(2 * (c + l), "m")], ["% do terreno", `${((A / areaTerreno()) * 100).toFixed(2)} %`]);
  if (e.altura >= 1) m.push(["Volume do envelope", f(A * e.altura, "m³", 0)]);
  if (e.id === "pista") m.push(["Área em hectares", f(A / 10000, "ha", 2)], ["Na maquete 1:500", `${f(c / 500, "m", 2)} × ${f(l / 500, "m", 3)}`], ["Designação (da maquete)", "27 / 09"]);
  if (e.id === "estacionamento") m.push(["Vagas teóricas (25 m²/vaga)", f(Math.floor(A / 25), "vagas", 0)]);
  return m;
}
