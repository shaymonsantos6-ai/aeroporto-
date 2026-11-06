export const CATEGORIAS = ["Terraplenagem", "Pavimentação", "Drenagem", "Edificações", "Sinalização", "Maquete"] as const;
export type Categoria = (typeof CATEGORIAS)[number];
export type Linha = {
  id: string; categoria: Categoria; servico: string; unidade: string;
  quantidade: number; preco: number; fonte: string; data: string; obs: string;
};

const num = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
export const totalLinha = (l: Pick<Linha, "quantidade" | "preco">) => num(l.quantidade) * num(l.preco);

export function resumo(linhas: Linha[], contingenciaPct: number) {
  if (!Number.isFinite(contingenciaPct) || contingenciaPct < 0 || contingenciaPct > 100) {
    throw new Error("A contingência deve estar entre 0 e 100 %.");
  }
  const subtotais = Object.fromEntries(CATEGORIAS.map(c => [c, 0])) as Record<Categoria, number>;
  for (const l of linhas) subtotais[l.categoria] += totalLinha(l);
  const subtotal = Object.values(subtotais).reduce((a, b) => a + b, 0);
  const contingencia = subtotal * (contingenciaPct / 100);
  return { subtotais, subtotal, contingencia, total: subtotal + contingencia };
}

export function paraCsv(linhas: Linha[]): string {
  const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const cab = ["Categoria", "Serviço", "Unidade", "Quantidade", "Preço unitário", "Total", "Fonte do preço", "Data da cotação", "Observações"];
  return [cab.map(esc).join(";"), ...linhas.map(l => [l.categoria, l.servico, l.unidade, l.quantidade, l.preco, totalLinha(l), l.fonte, l.data, l.obs].map(esc).join(";"))].join("\r\n");
}
