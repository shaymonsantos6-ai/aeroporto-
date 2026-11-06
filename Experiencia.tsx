"use client";
import { assetPath } from "@/lib/asset-path";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ELEMENTOS, area, areaTerreno, porId } from "@/lib/dados";
import { PROJETO } from "@/lib/projeto";
import PlantaSVG from "./PlantaSVG";
import MiniMapa from "./MiniMapa";
import PainelMedidas from "./PainelMedidas";
import Joystick from "./Joystick";
import Radar, { type InfoJogador } from "./Radar";
import type { Hora } from "./AirportCanvas";
import type { Joy } from "./Jogador";
import Icone from "./Icone";
import type { Camadas } from "./Aeroporto";

const Canvas3D = dynamic(() => import("./AirportCanvas"), { ssr: false });
const SECOES = ["Início", "Visão geral", "Modelo 3D", "Planta técnica", "Engenharia", "Equipe e maquete"];
const fmt = (n: number) => n.toLocaleString("pt-BR");

const CAMADAS_NOMES: [keyof Camadas, string][] = [
  ["aeronaves", "Aeronaves"], ["iluminacao", "Iluminação"], ["vegetacao", "Vegetação"], ["edificios", "Edificações"], ["drenagem", "Drenagem"], ["vida", "Pessoas e veículos"],
];

export default function Experiencia() {
  const progresso = useRef(0);
  const selRef = useRef<string | null>(null);
  const selProg = useRef(0);
  const [ativa, setAtiva] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [pronto, setPronto] = useState(false);
  const [reduzido, setReduzido] = useState(false);
  const [camadas, setCamadas] = useState<Camadas>({ aeronaves: true, iluminacao: true, vegetacao: true, edificios: true, drenagem: false, vida: true });
  const [modo, setModo] = useState<"tour" | "explorar">("tour");
  const [proximo, setProximo] = useState<string | null>(null);
  const [mapaAberto, setMapaAberto] = useState(false);
  const [toque, setToque] = useState(false);
  const joy = useRef<Joy>({ x: 0, y: 0 });
  const proxRef = useRef<string | null>(null);
  const scrollGuardado = useRef(0);
  const explorando = modo === "explorar";
  const [hora, setHora] = useState<Hora>("tarde");
  const [nivel, setNivel] = useState(1);
  const [visao, setVisao] = useState<"maquete" | "real">("maquete");
  const [visitados, setVisitados] = useState<string[]>([]);
  const info = useRef<InfoJogador>({ x: -2, z: -12.6, az: 3.14 });

  const selecionar = useCallback((id: string | null) => {
    selRef.current = id; selProg.current = progresso.current; setSel(id);
  }, []);

  useEffect(() => {
    try { const c = document.createElement("canvas"); setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl"))); } catch { setWebgl(false); }
    setReduzido(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const onScroll = () => {
      if (document.body.style.overflow === "hidden") return;
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / ((SECOES.length - 1) * vh)));
      progresso.current = p;
      setAtiva(Math.round(p * (SECOES.length - 1)));
      if (selRef.current && Math.abs(p - selProg.current) > 0.03) { selRef.current = null; setSel(null); }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const limite = window.setTimeout(() => setPronto(true), 15000);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); window.clearTimeout(limite); };
  }, []);

  const ir = (i: number) => window.scrollTo({ top: i * window.innerHeight, behavior: reduzido ? "auto" : "smooth" });
  const carregando = webgl === null || (webgl && !pronto);
  const entrar = useCallback(() => { scrollGuardado.current = window.scrollY; selecionar(null); setModo("explorar"); }, [selecionar]);
  const sair = useCallback(() => { setModo("tour"); selecionar(null); proxRef.current = null; setProximo(null); }, [selecionar]);
  useEffect(() => {
    setMapaAberto(window.innerWidth >= 768);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setToque(coarse); setNivel(coarse ? 0 : 1);
  }, []);
  useEffect(() => {
    if (modo !== "explorar") return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") sair();
      if (e.code === "KeyE" && proxRef.current) selecionar(proxRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); window.scrollTo(0, scrollGuardado.current); };
  }, [modo, sair, selecionar]);
  useEffect(() => { if (explorando && sel) setVisitados(v => (v.includes(sel) ? v : [...v, sel])); }, [explorando, sel]);
  const atual = sel ? porId(sel) : null;
  const pista = porId("pista")!;
  const construido = ELEMENTOS.filter(e => ["terminal", "hangar", "hangar2", "galpao", "oficina", "predios", "torre"].includes(e.id)).reduce((s, e) => s + area(e), 0);

  return (
    <>
      {/* tela de carregamento com o mamute */}
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#071B33] transition-opacity duration-700 ${carregando ? "opacity-100" : "pointer-events-none opacity-0"}`} role="status" aria-live="polite">
        <img src={assetPath("/brand/mamute.png")} alt="" className="pulso h-48 w-auto md:h-64" />
        <p className="mt-6 text-sm tracking-widest text-claro">CARREGANDO O AERÓDROMO</p>
      </div>

      {/* cena 3D fixa */}
      <div className="fixed inset-0 z-0 bg-[#071B33]">
        {webgl ? (
          <Canvas3D progresso={progresso} camadas={camadas} selecionado={sel} rotulos={ativa === 2} reduzido={reduzido} modo={modo} joy={joy} hora={hora} visao={explorando ? "real" : visao} nivel={nivel} onNivel={setNivel} info={info} onSelecionar={selecionar} onPronto={() => setPronto(true)} onProximo={id => { proxRef.current = id; setProximo(id); }} />
        ) : webgl === false ? (
          <>
            <img src={assetPath("/brand/fallback-aereo.jpg")} alt="Ilustração conceitual do aeródromo visto de cima" className="h-full w-full object-cover opacity-70" />
            <p role="alert" className="absolute bottom-4 left-4 right-4 rounded bg-black/60 p-3 text-sm">WebGL indisponível neste dispositivo: exibindo uma ilustração. Planta, calculadoras e memorial funcionam normalmente.</p>
          </>
        ) : null}
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(7,27,51,.55) 0%, rgba(7,27,51,0) 22%, rgba(7,27,51,0) 70%, rgba(7,27,51,.6) 100%)" }} />

      {/* navegação lateral por pontos */}
      <nav aria-label="Seções da página" className={`fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 md:flex ${explorando ? "!hidden" : ""}`}>
        {SECOES.map((s, i) => (
          <button key={s} type="button" onClick={() => ir(i)} aria-label={`Ir para ${s}`} aria-current={ativa === i} className="group flex items-center justify-end gap-2">
            <span className={`rounded bg-[#071B33]/80 px-2 py-1 text-xs opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100`}>{s}</span>
            <span className={`block rounded-full border border-claro transition-all ${ativa === i ? "h-6 w-2.5 bg-eletrico" : "h-2.5 w-2.5 bg-transparent"}`} />
          </button>
        ))}
      </nav>

      <main className={`pointer-events-none relative z-10 ${explorando ? "hidden" : ""}`}>
        {/* 0 — início */}
        <section id="inicio" className="relative flex h-dvh items-center px-5 pt-16 md:px-16">
          <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(90deg, rgba(7,27,51,.82) 0%, rgba(7,27,51,.45) 45%, rgba(7,27,51,0) 75%)" }} />
          <div className="pointer-events-auto max-w-2xl entrada">
            <p className="mb-3 text-xs font-semibold tracking-[.25em] text-claro">PROJETO ACADÊMICO · ENGENHARIA CIVIL · UDF</p>
            <h1 className="text-[clamp(2.6rem,9vw,6.5rem)] font-extrabold leading-[.95] tracking-tight">
              AEROPORTO<br /><span className="titulo-grad">OS TCHUTCHUCOS</span>
            </h1>
            <p className="mt-5 text-xl font-medium">Mais que um projeto, é a nossa visão de futuro.</p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-gelo/80">Um aeródromo regional conceitual, com tecnologia, cálculo de engenharia e uma equipe unida por um mesmo objetivo: transformar ideias em grandes projetos.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => ir(2)} className="btn btn-primario">Explorar o projeto <span aria-hidden>→</span></button>
              {webgl && <button type="button" onClick={entrar} className="btn btn-borda">Explorar a pé (modo jogo)</button>}
              <Link href="/calculadoras" className="btn btn-borda">Abrir calculadoras</Link>
            </div>
          </div>
          <img src={assetPath("/brand/mamute.png")} alt="Mamute, símbolo oficial do projeto" className="mamute-flutua pointer-events-none absolute right-[4%] top-[18%] hidden h-[56vh] w-auto lg:block" />
          <ul className="pointer-events-auto absolute right-14 top-[30%] hidden space-y-4 text-sm xl:block">
            {([["cubo", "3D interativo", "/#modelo"], ["planta", "Planta técnica", "/planta"], ["calc", "Calculadoras", "/calculadoras"], ["doc", "Memorial de cálculo", "/memorial"]] as const).map(([i, t, h]) => (
              <li key={t}><Link href={h} className="flex items-center gap-3 text-gelo/90 hover:text-claro"><Icone n={i} className="h-6 w-6 text-claro" />{t}</Link></li>
            ))}
          </ul>
          <button type="button" onClick={() => ir(1)} aria-label="Rolar para a próxima seção" className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 text-xs tracking-widest text-claro">
            <span className="mx-auto mb-1 block h-8 w-5 rounded-full border border-claro"><span className="rolar mx-auto mt-1.5 block h-1.5 w-1 rounded bg-claro" /></span>ROLE
          </button>
        </section>

        {/* 1 — visão geral */}
        <section id="visao" className="flex h-dvh items-center px-5 pt-16 md:px-16">
          <div className="pointer-events-auto max-w-xl">
            <h2 className="text-4xl font-extrabold md:text-5xl">Visão geral do aeródromo</h2>
            <p className="mt-3 text-gelo/80">Pista, táxi, pátio, terminal, hangar, estacionamento e acessos, organizados sobre um terreno de {fmt(areaTerreno() / 10000)} ha. Todos os números abaixo saem da mesma fonte de dados que alimenta o 3D, a planta e o orçamento.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                [`${fmt(Math.max(...pista.dim))} × ${Math.min(...pista.dim)} m`, "Pista (hipotética)"],
                [`${fmt(area(pista))} m²`, "Área da pista"],
                [`${fmt(construido)} m²`, "Edificações em planta"],
                [`${ELEMENTOS.length} elementos`, "Cadastrados na base"],
              ].map(([v, l]) => (
                <div key={l} className="glass cartao p-4"><p className="text-xl font-bold text-claro">{v}</p><p className="text-xs text-gelo/70">{l}</p></div>
              ))}
            </div>
            <p className="mt-4 text-xs text-tecnico">Dimensões hipotéticas, a substituir pelos dados da equipe em lib/dados.ts.</p>
          </div>
        </section>

        {/* 2 — modelo 3D */}
        <section id="modelo" className="flex h-dvh items-end gap-4 px-5 pb-6 pt-20 md:items-center md:px-16 md:pb-0">
          <div className="glass pointer-events-auto w-full max-w-sm p-5">
            <h2 className="text-2xl font-extrabold">Modelo 3D interativo</h2>
            <p className="mt-1 text-sm text-gelo/80">Clique em um elemento da cena ou escolha na lista. A câmera se aproxima dele.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ELEMENTOS.map(e => (
                <button key={e.id} type="button" onClick={() => selecionar(sel === e.id ? null : e.id)} aria-pressed={sel === e.id} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${sel === e.id ? "border-eletrico bg-eletrico" : "border-claro/40 hover:bg-white/10"}`}>{e.nome}</button>
              ))}
            </div>
            <fieldset className="mt-4">
              <legend className="mb-1 text-xs font-semibold text-claro">Camadas</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {CAMADAS_NOMES.map(([k, n]) => (
                  <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={camadas[k]} onChange={ev => setCamadas(c => ({ ...c, [k]: ev.target.checked }))} />{n}</label>
                ))}
              </div>
            </fieldset>
          </div>
          <p className="glass pointer-events-auto ml-auto hidden max-w-xs p-4 text-sm text-gelo/80 md:block">Clique em qualquer elemento para ver as medidas. Quer andar pelo aeroporto? Use “Explorar a pé”.</p>
        </section>

        {/* 3 — planta */}
        <section id="planta" className="flex h-dvh items-center justify-end px-5 pt-16 md:px-16">
          <div className="glass pointer-events-auto w-full max-w-xl p-5">
            <h2 className="text-3xl font-extrabold">Planta técnica interativa</h2>
            <p className="mt-2 text-sm text-gelo/80">Vista superior em SVG, com cotas, norte, escala gráfica, quadro de áreas, zoom e exportação. Consome os mesmos dados do modelo 3D.</p>
            <div className="mt-4 aspect-[1060/880] overflow-hidden rounded-lg border border-white/15"><PlantaSVG /></div>
            <Link href="/planta" className="btn btn-primario mt-4">Abrir planta técnica <span aria-hidden>→</span></Link>
          </div>
        </section>

        {/* 4 — engenharia */}
        <section id="engenharia" className="flex h-dvh items-center px-5 pt-16 md:px-16">
          <div className="pointer-events-auto w-full max-w-4xl">
            <h2 className="text-4xl font-extrabold md:text-5xl">Engenharia que se pode conferir</h2>
            <p className="mt-2 max-w-xl text-gelo/80">Cada cálculo mostra fórmula, substituição e hipóteses. O memorial é montado só com o que foi calculado.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {([
                ["calc", "Calculadoras", "Pista, escala, declividade, drenagem, terraplenagem, pavimento e vagas.", "/calculadoras"],
                ["doc", "Memorial de cálculo", "Fórmulas, hipóteses e resultados registrados, com CSV e PDF.", "/memorial"],
                ["moeda", "Orçamento", "Quantitativos por categoria, preços fictícios editáveis e contingência.", "/orcamento"],
                ["planta", "Planta técnica", "Cotas, camadas, quadro de áreas e exportação.", "/planta"],
                ["livro", "Referências", "ANAC, ABNT e fontes. Datas de consulta a preencher.", "/referencias"],
              ] as const).map(([i, t, d, h]) => (
                <Link key={t} href={h} className="glass cartao block p-4">
                  <Icone n={i} className="h-7 w-7 text-claro" />
                  <h3 className="mt-2 font-bold">{t}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gelo/75">{d}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 5 — equipe e maquete */}
        <section id="equipe" className="flex h-dvh items-center px-5 pt-16 md:px-16">
          <div className="pointer-events-auto grid w-full max-w-5xl gap-4 md:grid-cols-2">
            <div className="glass p-5">
              <h2 className="text-3xl font-extrabold">Equipe</h2>
              <p className="mt-1 text-sm text-claro">{PROJETO.curso} — {PROJETO.instituicao}</p>
              <dl className="mt-3 space-y-1 text-sm">
                {([["Disciplina", PROJETO.disciplina], ["Professor orientador", PROJETO.professor], ["Semestre", PROJETO.semestre], ["Apresentação", PROJETO.dataApresentacao]] as const).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4"><dt className="text-tecnico">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
              <ul className="mt-3 list-disc pl-5 text-sm text-gelo/80">{PROJETO.integrantes.map(n => <li key={n}>{n}</li>)}</ul>
              <p className="mt-3 text-xs text-tecnico">Preencha em lib/projeto.ts. Nenhum nome ou aprovação foi inventado.</p>
            </div>
            <div className="glass p-5">
              <h2 className="text-3xl font-extrabold">Maquete física</h2>
              <p className="mt-1 text-sm text-gelo/80">Escala: {PROJETO.escalaMaquete}. Materiais: {PROJETO.materiaisMaquete}. A cena 3D segue a disposição desta referência.</p>
              <figure className="mt-3"><img src={assetPath("/referencia/maquete-referencia.jpg")} alt="Foto de referência da maquete: pista à direita, rede de táxi em Y, pátios, hangares arqueados e torre" className="w-full rounded border border-white/15" /><figcaption className="mt-1 text-[11px] text-tecnico">Imagem de referência para a maquete. Não é a maquete pronta.</figcaption></figure>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[1, 2, 3].map(n => <div key={n} className="flex aspect-square items-center justify-center rounded border border-dashed border-claro/40 p-2 text-center text-[11px] text-tecnico">Foto da maquete a adicionar</div>)}
              </div>
              <Link href="/calculadoras" className="btn btn-borda mt-4 text-sm">Calcular escala da maquete</Link>
            </div>
          </div>
        </section>
      </main>

      {webgl && (
        <div className="fixed left-3 top-32 z-30 flex flex-col gap-1.5 text-xs">
          <div className="glass flex overflow-hidden" role="group" aria-label="Hora do dia">
            {(["dia", "tarde", "noite"] as const).map(h => (
              <button key={h} type="button" aria-pressed={hora === h} onClick={() => setHora(h)} className={`px-2.5 py-1.5 capitalize ${hora === h ? "bg-eletrico" : "hover:bg-white/10"}`}>{h}</button>
            ))}
          </div>
          <button type="button" disabled={explorando} aria-pressed={visao === "maquete"} onClick={() => setVisao(v => (v === "maquete" ? "real" : "maquete"))} className="glass px-2.5 py-1.5 text-left disabled:opacity-50">Visão: {explorando ? "real (modo jogo)" : visao}</button>
          <button type="button" onClick={() => setNivel(v => (v + 1) % 3)} className="glass px-2.5 py-1.5 text-left">Qualidade: {["baixa", "média", "alta"][nivel]}</button>
        </div>
      )}
      {webgl && !explorando && (
        <button type="button" onClick={entrar} className="btn btn-primario fixed left-3 top-20 z-30 !px-3 !py-2 text-xs md:text-sm">Explorar a pé</button>
      )}
      {explorando && (
        <>
          <button type="button" onClick={sair} className="btn btn-borda fixed left-3 top-20 z-30 !px-3 !py-2 text-xs backdrop-blur md:text-sm">Sair do modo jogo</button>
          <div className="pointer-events-none fixed inset-x-0 top-20 z-30 flex justify-center px-3">
            <div className="glass px-4 py-2 text-center text-xs">
              <p>{toque ? "Joystick para andar · arraste a tela para girar a câmera" : "WASD ou setas andam · Shift corre · arraste ou Q/R giram a câmera · E inspeciona · Esc sai"}</p>
              <p className="mt-1 font-semibold text-claro">Missão: inspecione todos os locais ({visitados.length}/{ELEMENTOS.length}){visitados.length === ELEMENTOS.length ? " — concluída!" : ""}</p>
            </div>
          </div>
          <Radar info={info} visitados={visitados} />
          {proximo && (
            <div className="fixed bottom-44 left-1/2 z-30 -translate-x-1/2 md:bottom-20">
              <button type="button" onClick={() => selecionar(proximo)} className="btn btn-primario">{toque ? "" : "E · "}Inspecionar: {porId(proximo)?.nome}</button>
            </div>
          )}
          {toque && <Joystick joy={joy} />}
        </>
      )}
      <PainelMedidas elemento={atual ?? null} onFechar={() => selecionar(null)} />
      {webgl && <MiniMapa aberto={mapaAberto} onAlternar={() => setMapaAberto(v => !v)} reduzido={reduzido} />}
    </>
  );
}
