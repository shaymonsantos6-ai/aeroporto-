import { describe, it, expect } from "vitest";
import { compilar, estadoRota } from "../lib/agentes";
import { voosAtivos, posicaoVoo, destinoSaida, numeroSaida } from "../lib/voos";
import { resolver, TERM, H1 } from "../lib/colisao";
import { criarTrajeto, suavizar } from "../lib/trajeto";
import { medidasDe, ELEMENTOS, TAXIS, caixaDe, areaTerreno, TERRENO } from "../lib/dados";

describe("rotas e voos", () => {
  it("rota linear: metade do caminho em t = d/(2v)", () => { expect(estadoRota(compilar({ pts: [[0, 0], [10, 0]], vel: 1 }), 5).x).toBeCloseTo(5); });
  it("some durante a pausa", () => { expect(estadoRota(compilar({ pts: [[0, 0], [10, 0]], vel: 1, pausa: 5 }), 12).visivel).toBe(false); });
  it("fica parado no ponto de espera", () => {
    const s = estadoRota(compilar({ pts: [[0, 0], [10, 0], [10, 5]], vel: 1, espera: { 1: 4 } }), 12); expect(s.parado).toBe(true); expect(s.x).toBeCloseTo(10);
  });
  it("rota de um ponto (carro estacionado) fica visível e parada", () => {
    const s = estadoRota(compilar({ pts: [[3, 4]], vel: 1, rot: 1.2 }), 1234); expect(s.visivel).toBe(true); expect(s.parado).toBe(true); expect(s.x).toBe(3); expect(s.rot).toBeCloseTo(1.2);
  });
  it("decolagem do ciclo 0 aparece no mapa", () => {
    const v = voosAtivos(11.5).find(f => f.tipo === "saida"); expect(v?.para).toBe(destinoSaida(0)); expect(v?.num).toBe(numeroSaida(0));
  });
  it("progresso do voo entre 0 e 1 e posição finita", () => {
    for (let t = 0; t < 200; t += 3.7) voosAtivos(t).forEach(v => { expect(v.p).toBeGreaterThanOrEqual(0); expect(v.p).toBeLessThanOrEqual(1); expect(Number.isFinite(posicaoVoo(v).lat)).toBe(true); });
  });
});

describe("trajetos", () => {
  it("comprimento e direção", () => {
    const t = criarTrajeto([[0, 0], [10, 0], [10, 10]]);
    expect(t.len).toBeCloseTo(20); expect(t.em(5).x).toBeCloseTo(5); expect(t.em(15).z).toBeCloseTo(5); expect(t.em(2).rot).toBeCloseTo(0);
  });
  it("suavização mantém início e fim", () => {
    const p = suavizar([[0, 0], [10, 0], [10, 10]], 3); expect(p[0]).toEqual([0, 0]); expect(p[p.length - 1]).toEqual([10, 10]); expect(p.length).toBeGreaterThan(3);
  });
});

describe("layout da maquete", () => {
  const sol = ELEMENTOS.filter(e => e.tipo !== "rede");
  it("nenhum prédio ou pátio se sobrepõe", () => {
    for (let i = 0; i < sol.length; i++) for (let j = i + 1; j < sol.length; j++) {
      const a = caixaDe(sol[i]), b = caixaDe(sol[j]);
      const choca = a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
      if (choca) throw new Error(`${sol[i].id} sobrepõe ${sol[j].id}`);
    }
  });
  it("tudo (exceto a via de acesso, que chega à BR) fica dentro do terreno", () => {
    for (const e of sol.filter(e => e.id !== "acesso")) { const b = caixaDe(e); expect(b.x0 >= TERRENO.x[0] && b.x1 <= TERRENO.x[1] && b.z0 >= TERRENO.z[0] && b.z1 <= TERRENO.z[1]).toBe(true); }
  });
  it("a rede de táxi tem 4 ramos e a área é comprimento × largura", () => {
    expect(TAXIS).toHaveLength(4);
    const t = ELEMENTOS.find(e => e.tipo === "rede")!; expect(t.dim[0] * t.dim[1]).toBeGreaterThan(10000);
  });
  it("terreno de 1.000 × 760 m", () => { expect(areaTerreno()).toBe(760000); });
  it("medidas do hangar 1", () => {
    const m = Object.fromEntries(medidasDe(ELEMENTOS.find(e => e.id === "hangar")!));
    expect(m["Comprimento"]).toBe("110 m"); expect(m["Largura"]).toBe("80 m"); expect(m["Área em planta"]).toBe("8.800 m²");
  });
  it("medidas da pista: 700 × 60 m", () => {
    const m = Object.fromEntries(medidasDe(ELEMENTOS.find(e => e.id === "pista")!));
    expect(m["Comprimento"]).toBe("700 m"); expect(m["Largura"]).toBe("60 m"); expect(m["Designação (da maquete)"]).toBe("27 / 09");
  });
});

describe("colisão e interiores", () => {
  it("entra no hangar pela porta e é barrado pela parede lateral", () => {
    const zf = H1.cz + H1.d / 2;
    expect(resolver(H1.cx, zf + 0.1, 0, -0.1)[1]).toBeCloseTo(zf);
    expect(resolver(H1.cx - 2, zf + 0.1, 0, -0.1)[1]).toBeCloseTo(zf + 0.1);
  });
  it("entra no terminal pela porta central e não atravessa a parede", () => {
    const zn = TERM.cz - TERM.d / 2;
    expect(resolver(TERM.cx + 0.2, zn - 0.1, 0, 0.1)[1]).toBeCloseTo(zn);
    expect(resolver(TERM.cx - 3, zn - 0.1, 0, 0.1)[1]).toBeCloseTo(zn - 0.1);
  });
  it("o jogador anda livre na via de acesso", () => { expect(resolver(-2, -15, 0, 0.3)[1]).toBeCloseTo(-14.7); });
});
