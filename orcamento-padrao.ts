import { ELEMENTOS, area, comprimentoDrenagem, porId } from "./dados";
import type { Linha } from "./orcamento";

const A = (id: string) => area(porId(id)!);
const F = "FICTÍCIO — exemplo, não é cotação";
const mk = (id: string, categoria: Linha["categoria"], servico: string, unidade: string, quantidade: number, preco: number, obs = ""): Linha =>
  ({ id, categoria, servico, unidade, quantidade, preco, fonte: F, data: "—", obs });

export const LINHAS_PADRAO: Linha[] = [
  mk("t1", "Terraplenagem", "Regularização do terreno (pista, táxi e pátio)", "m²", A("pista") + A("taxiway") + (A("patio") + A("patioN")), 2.5, "Quantidade geométrica"),
  mk("t2", "Terraplenagem", "Escavação e aterro (volume — use a calculadora)", "m³", 0, 18, "Preencher após o cálculo por áreas médias"),
  mk("p1", "Pavimentação", "Pavimento da pista", "m²", A("pista"), 180),
  mk("p2", "Pavimentação", "Pavimento da pista de táxi", "m²", A("taxiway"), 170),
  mk("p3", "Pavimentação", "Pavimento do pátio", "m²", (A("patio") + A("patioN")), 190),
  mk("p4", "Pavimentação", "Estacionamento e via de acesso", "m²", A("estacionamento") + A("acesso"), 95),
  mk("d1", "Drenagem", "Rede de drenagem conceitual", "m", Math.round(comprimentoDrenagem()), 350, "Comprimento das linhas esquemáticas"),
  mk("d2", "Drenagem", "Bacia de detenção", "un", 1, 80000),
  mk("e1", "Edificações", "Terminal de passageiros (1 pavimento)", "m²", A("terminal"), 4200),
  mk("e2", "Edificações", "Hangar", "m²", (A("hangar") + A("hangar2") + A("galpao") + A("oficina")), 2600),
  mk("s1", "Sinalização", "Pintura de marcas da pista", "m²", 600, 28, "Estimativa da equipe — ajustar"),
  mk("s2", "Sinalização", "Balizamento luminoso", "vb", 1, 250000),
  mk("m1", "Maquete", "Materiais da maquete", "vb", 1, 0, "Preencher com os gastos reais"),
];
export const _n = ELEMENTOS.length;
