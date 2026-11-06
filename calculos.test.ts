import { describe, it, expect } from "vitest";
import { areaRetangular, escalaMaquete, declividade, metodoRacional, areasMedias, converter } from "../lib/calculos";

describe("calculos", () => {
  it("área retangular", () => expect(areaRetangular(1200, 30).resultado).toBe(36000));
  it("escala 1:500", () => expect(escalaMaquete(1200, 500).resultado).toBeCloseTo(2.4));
  it("declividade 2 m em 100 m = 2%", () => expect(declividade(2, 100).resultado).toBeCloseTo(2));
  it("racional C=0,9 i=100 A=2", () => expect(metodoRacional(0.9, 100, 2).resultado).toBeCloseTo(0.5));
  it("áreas médias", () => expect(areasMedias([{ distancia: 0, area: 10 }, { distancia: 20, area: 30 }]).resultado).toBe(400));
  it("conversões", () => { expect(converter(150, "cm", "m")).toBeCloseTo(1.5); expect(converter(2, "ha", "m²")).toBe(20000); });
  it("rejeita divisão por zero", () => { expect(() => declividade(1, 0)).toThrow(); expect(() => escalaMaquete(10, 0)).toThrow(); });
  it("rejeita C inválido", () => expect(() => metodoRacional(1.5, 100, 1)).toThrow());
  it("rejeita unidades incompatíveis", () => expect(() => converter(1, "m", "ha")).toThrow());
});

import { volumeCamada, vagasEstacionamento } from "../lib/calculos";
import { resumo, totalLinha, paraCsv, type Linha } from "../lib/orcamento";

const L = (categoria: Linha["categoria"], quantidade: number, preco: number): Linha =>
  ({ id: "x", categoria, servico: "s", unidade: "m²", quantidade, preco, fonte: "f", data: "-", obs: "" });

describe("camadas, vagas e orçamento", () => {
  it("volume de camada 1000 m² x 20 cm = 200 m³", () => expect(volumeCamada(1000, 20).resultado).toBeCloseTo(200));
  it("vagas: 10500 m² a 25 m²/vaga = 420", () => expect(vagasEstacionamento(10500, 25).resultado).toBe(420));
  it("rejeita área por vaga zero", () => expect(() => vagasEstacionamento(100, 0)).toThrow());
  it("total da linha ignora valores inválidos", () => expect(totalLinha({ quantidade: NaN, preco: 5 })).toBe(0));
  it("resumo com contingência de 10%", () => {
    const r = resumo([L("Pavimentação", 10, 100), L("Drenagem", 5, 40)], 10);
    expect(r.subtotal).toBe(1200); expect(r.contingencia).toBeCloseTo(120); expect(r.total).toBeCloseTo(1320);
    expect(r.subtotais["Pavimentação"]).toBe(1000);
  });
  it("contingência fora da faixa lança erro", () => expect(() => resumo([], 150)).toThrow());
  it("CSV tem cabeçalho e uma linha por item", () => expect(paraCsv([L("Maquete", 1, 1)]).split("\r\n")).toHaveLength(2));
});
