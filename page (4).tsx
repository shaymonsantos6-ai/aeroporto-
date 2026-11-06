import Planta from "@/components/Planta";
export const metadata = { title: "Planta técnica" };
export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-14 pt-28">
      <h1 className="text-3xl font-extrabold md:text-4xl">Planta técnica interativa</h1>
      <p className="mb-5 mt-2 text-sm text-tecnico">Gerada a partir de lib/dados.ts, a mesma fonte do modelo 3D.</p>
      <Planta />
    </main>
  );
}
