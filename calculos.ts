// Motor de cálculos independente da interface.
export type Resultado = {
  nome: string; disciplina: string; entradas: Record<string, number>;
  formula: string; substituicao: string; resultado: number; unidade: string;
  hipoteses: string[]; validacao: string; data: string;
};

const positivo = (v: number, nome: string) => {
  if (!Number.isFinite(v) || v <= 0) throw new Error(`${nome} deve ser um número maior que zero.`);
};
const finito = (v: number, nome: string) => {
  if (!Number.isFinite(v)) throw new Error(`${nome} deve ser um número válido.`);
};
const fmt = (n: number) => Number(n.toFixed(4)).toString();
const VALIDACAO = "Estimativa preliminar acadêmica — não validada";
const base = (nome: string, disciplina: string, entradas: Record<string, number>, formula: string,
  substituicao: string, resultado: number, unidade: string, hipoteses: string[]): Resultado =>
  ({ nome, disciplina, entradas, formula, substituicao, resultado, unidade, hipoteses, validacao: VALIDACAO, data: new Date().toISOString() });

export function areaRetangular(comprimento: number, largura: number): Resultado {
  positivo(comprimento, "Comprimento"); positivo(largura, "Largura");
  const r = comprimento * largura;
  return base("Área da pista", "Geometria", { comprimento, largura }, "A = L × B",
    `A = ${fmt(comprimento)} × ${fmt(largura)} = ${fmt(r)} m²`, r, "m²",
    ["Pista retangular", "A área não comprova atendimento a norma ou aeronave"]);
}

export function escalaMaquete(medidaReal: number, denominador: number): Resultado {
  positivo(medidaReal, "Medida real"); positivo(denominador, "Denominador da escala");
  const r = medidaReal / denominador;
  return base("Conversão para escala da maquete", "Maquete", { medidaReal, denominador }, "m = real ÷ N  (escala 1:N)",
    `m = ${fmt(medidaReal)} ÷ ${fmt(denominador)} = ${fmt(r)} m`, r, "m", ["Escala uniforme nos três eixos"]);
}

export function declividade(diferencaNivel: number, distanciaHorizontal: number): Resultado {
  finito(diferencaNivel, "Diferença de nível"); positivo(distanciaHorizontal, "Distância horizontal");
  const r = (diferencaNivel / distanciaHorizontal) * 100;
  return base("Declividade", "Terraplenagem", { diferencaNivel, distanciaHorizontal }, "i(%) = Δh ÷ d × 100",
    `i = ${fmt(diferencaNivel)} ÷ ${fmt(distanciaHorizontal)} × 100 = ${fmt(r)} %`, r, "%", ["Terreno com inclinação uniforme"]);
}

export function metodoRacional(c: number, intensidadeMmH: number, areaHa: number): Resultado {
  if (!Number.isFinite(c) || c <= 0 || c > 1) throw new Error("Coeficiente de escoamento deve estar entre 0 (exclusive) e 1.");
  positivo(intensidadeMmH, "Intensidade"); positivo(areaHa, "Área contribuinte");
  const r = (c * intensidadeMmH * areaHa) / 360;
  return base("Vazão pelo método racional", "Drenagem", { c, intensidadeMmH, areaHa }, "Q = C × i × A ÷ 360  (Q em m³/s, i em mm/h, A em ha)",
    `Q = ${fmt(c)} × ${fmt(intensidadeMmH)} × ${fmt(areaHa)} ÷ 360 = ${fmt(r)} m³/s`, r, "m³/s",
    ["C e i são valores informados pelo usuário", "Exige dados pluviométricos locais para validação"]);
}

export function areasMedias(secoes: { distancia: number; area: number }[]): Resultado {
  if (secoes.length < 2) throw new Error("Informe ao menos duas seções.");
  let vol = 0; const termos: string[] = [];
  for (let i = 0; i < secoes.length - 1; i++) {
    const a = secoes[i], b = secoes[i + 1];
    finito(a.area, "Área"); finito(b.area, "Área");
    if (a.area < 0 || b.area < 0) throw new Error("Áreas não podem ser negativas.");
    const d = b.distancia - a.distancia;
    if (!Number.isFinite(d) || d <= 0) throw new Error("As distâncias devem ser crescentes.");
    const v = ((a.area + b.area) / 2) * d; vol += v;
    termos.push(`(${fmt(a.area)}+${fmt(b.area)})/2×${fmt(d)}`);
  }
  return base("Volume por áreas médias", "Terraplenagem", Object.fromEntries(secoes.flatMap((s, i) => [[`d${i}`, s.distancia], [`A${i}`, s.area]])),
    "V = Σ [(A₁ + A₂) ÷ 2 × d]", `V = ${termos.join(" + ")} = ${fmt(vol)} m³`, vol, "m³",
    ["Seções fictícias ou informadas pelo usuário", "Exige levantamento topográfico real"]);
}

const PARA_METRO: Record<string, number> = { m: 1, cm: 0.01, mm: 0.001 };
const PARA_M2: Record<string, number> = { "m²": 1, ha: 10000 };
export function converter(valor: number, de: string, para: string): number {
  finito(valor, "Valor");
  const tab = de in PARA_METRO && para in PARA_METRO ? PARA_METRO : de in PARA_M2 && para in PARA_M2 ? PARA_M2 : null;
  if (!tab) throw new Error("Conversão entre unidades incompatíveis.");
  return (valor * tab[de]) / tab[para];
}

export const CSV_CABECALHO = ["Nome", "Disciplina", "Fórmula", "Substituição", "Resultado", "Unidade", "Validação", "Data"];
export function paraCsv(lista: Resultado[]): string {
  const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  return [CSV_CABECALHO.map(esc).join(";"),
    ...lista.map(r => [r.nome, r.disciplina, r.formula, r.substituicao, r.resultado, r.unidade, r.validacao, r.data].map(esc).join(";"))].join("\r\n");
}

export function volumeCamada(areaM2: number, espessuraCm: number): Resultado {
  positivo(areaM2, "Área"); positivo(espessuraCm, "Espessura");
  const r = areaM2 * (espessuraCm / 100);
  return base("Volume geométrico de camada", "Pavimentação", { areaM2, espessuraCm }, "V = A × e",
    `V = ${fmt(areaM2)} × ${fmt(espessuraCm)} ÷ 100 = ${fmt(r)} m³`, r, "m³",
    ["Volume geométrico, sem empolamento nem compactação", "Espessuras de projeto exigem dimensionamento de pavimento"]);
}

export function vagasEstacionamento(areaM2: number, areaPorVaga: number): Resultado {
  positivo(areaM2, "Área do estacionamento"); positivo(areaPorVaga, "Área por vaga");
  const r = Math.floor(areaM2 / areaPorVaga);
  return base("Vagas teóricas de estacionamento", "Estacionamento", { areaM2, areaPorVaga }, "N = ⌊A ÷ a⌋",
    `N = ⌊${fmt(areaM2)} ÷ ${fmt(areaPorVaga)}⌋ = ${r} vagas`, r, "vagas",
    ["A área por vaga já inclui circulação (hipótese)", "Não considera normas municipais de vagas especiais"]);
}
