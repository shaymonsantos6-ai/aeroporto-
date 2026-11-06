export const metadata = { title: "Referências técnicas" };
const refs = [
  ["ANAC RBAC nº 154", "Projeto de aeródromos. Verificar a edição vigente no site da ANAC."],
  ["ANAC RBAC nº 153", "Operação, manutenção e resposta à emergência. Quando pertinente."],
  ["Método racional (Q = C·i·A/360)", "Fórmula geral de drenagem. Coeficiente C e intensidade i exigem dados locais."],
  ["Método das áreas médias", "Fórmula geral de terraplenagem. Seções reais exigem levantamento topográfico."],
];
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-12 pt-28">
      <h1 className="text-3xl font-bold">Referências técnicas</h1>
      <p className="mt-2 rounded border border-yellow-500 p-3 text-sm">Data de consulta: <strong>preencher pela equipe</strong>. Nenhuma edição de norma foi verificada automaticamente. Confirme nas fontes oficiais.</p>
      <ul className="mt-6 space-y-3">{refs.map(([t, d]) => <li key={t}><strong>{t}</strong><br /><span className="text-tecnico">{d}</span></li>)}</ul>
    </main>
  );
}
