import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import Nav from "@/components/Nav";
import { assetPath } from "@/lib/asset-path";
import "./globals.css";

const fonte = Montserrat({ subsets: ["latin"], variable: "--fonte", display: "swap" });

export const metadata: Metadata = {
  title: "Aeroporto Os Tchutchucos — Estudantes de Engenharia UDF",
  description: "Projeto acadêmico e conceitual de aeródromo: modelo 3D interativo, planta técnica, calculadoras, memorial de cálculo e orçamento.",
  icons: { icon: assetPath("/brand/icone.png") },
  openGraph: { title: "Aeroporto Os Tchutchucos", description: "Projeto acadêmico de Engenharia Civil — UDF", images: [assetPath("/brand/logo-vertical.png")] },
};
export const viewport: Viewport = { themeColor: "#071B33" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fonte.variable}>
      <body>
        <Nav />
        {children}
        <footer className="relative z-20 border-t border-white/10 bg-[#050f1f] px-5 py-10 md:px-14">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img src={assetPath("/brand/mamute.png")} alt="Mamute, símbolo do projeto" className="h-16 w-auto" />
              <div>
                <p className="font-extrabold tracking-wide">AEROPORTO OS TCHUTCHUCOS</p>
                <p className="text-sm text-claro">Estudantes de Engenharia Civil — UDF</p>
                <p className="mt-1 text-xs italic text-tecnico">“Grandes projetos nascem de grandes equipes”</p>
              </div>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-tecnico">
              Projeto acadêmico e conceitual. Não possui aprovação da ANAC, responsabilidade técnica, levantamento topográfico ou ensaios. Dimensões e preços são hipotéticos até serem substituídos pelos dados da equipe.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
