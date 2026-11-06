import Calculadoras from "@/components/Calculadoras";
export const metadata = { title: "Calculadoras de Engenharia" };
export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-12 pt-28">
      <h1 className="mb-2 text-3xl font-bold">Calculadoras</h1>
      <p className="mb-6 text-sm text-tecnico">Cálculos executados no navegador. Resultados são estimativas preliminares e não comprovam atendimento a normas.</p>
      <Calculadoras />
    </main>
  );
}
