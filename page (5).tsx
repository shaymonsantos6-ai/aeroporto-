import Orcamento from "@/components/Orcamento";
export const metadata = { title: "Orçamento e quantitativos" };
export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-14 pt-28">
      <h1 className="mb-4 text-3xl font-extrabold md:text-4xl">Orçamento e quantitativos</h1>
      <Orcamento />
    </main>
  );
}
