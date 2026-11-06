"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { compilar, estadoRota, type P2, type Rota } from "@/lib/agentes";
import { agora } from "@/lib/voos";
import { STANDS } from "@/lib/layout";
import { CHAO } from "@/lib/cena/construtor";
import { criarCarro, type TipoCarro } from "@/lib/cena/carro";
import { criarPessoa } from "@/lib/cena/pessoa";

function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const amostra = <T,>(l: T[], dens: number) => l.filter((_, i) => (i * 0.618) % 1 < dens);

/* ---------------- PESSOAS: 4 chamadas de desenho para todas ---------------- */
const ROUPAS = ["#e4572e", "#f3a712", "#3bb273", "#4d9de0", "#7768ae", "#e8e8e8", "#c0392b", "#ff6b9d", "#1b998b", "#9a9a9a"];
const PELES = ["#f1c9a5", "#d9a47a", "#a8744f", "#7a4b2d", "#52331f"];
type Pessoa = { c: ReturnType<typeof compilar>; camisa: string; pele: string; mala: boolean; fase: number };

function criarPessoas(): Pessoa[] {
  const r = rng(11), rotas: { rota: Rota; mala: boolean; staff?: boolean }[] = [];
  const base = (sx: number, sz: number, st: P2, j: number): P2[] => [[sx, sz], [-3.0, sz], [-2.6 + j, -11.7], [-2 + j * 0.5, -10.9], [-2 + j * 0.5, -9.5], [-2 + j * 0.5, -8.1], [st[0] + 0.3, st[1] + 0.4]];
  const vaga = () => [-6.9 + r() * 3.8, r() < 0.5 ? -14.6 : -12.75] as P2;
  for (let i = 0; i < 16; i++) { const j = (r() - 0.5) * 0.5, v = vaga(); rotas.push({ mala: i % 3 !== 0, rota: { pts: base(v[0], v[1], STANDS[i % 3], j), vel: 0.5 + r() * 0.15, pausa: 10 + r() * 25, fase: r() * 90 } }); }
  for (let i = 0; i < 10; i++) { const j = (r() - 0.5) * 0.5, v = vaga(); rotas.push({ mala: i % 2 === 0, rota: { pts: base(v[0], v[1], STANDS[i % 3], j).reverse(), vel: 0.5 + r() * 0.15, pausa: 12 + r() * 25, fase: r() * 90 } }); }
  for (let i = 0; i < 8; i++) { const v = vaga(); rotas.push({ mala: false, rota: { pts: [v, [v[0] + (r() - 0.5) * 2, -13.7], [v[0] + (r() - 0.5) * 2, v[1]]], vel: 0.4, espera: { 1: 2 + r() * 4 }, pausa: 3, fase: r() * 40 } }); }
  for (let i = 0; i < 4; i++) { const z = -1.5 + i * 0.3; rotas.push({ mala: false, staff: true, rota: { pts: [[-9 + i, z], [3 - i, z], [-9 + i, z]], vel: 0.35, espera: { 1: 5 }, pausa: 2, fase: r() * 30 } }); }
  return rotas.map((q, i) => ({ c: compilar(q.rota), mala: q.mala, fase: r() * 6.28, camisa: q.staff ? "#ff8a00" : ROUPAS[(i * 3) % ROUPAS.length], pele: PELES[(i * 7) % PELES.length] }));
}

export function Pessoas({ movimento, dens }: { movimento: boolean; dens: number }) {
  const todos = useMemo(criarPessoas, []);
  const ps = useMemo(() => amostra(todos, dens), [todos, dens]);
  const g = useMemo(criarPessoa, []);
  const A = useRef<THREE.InstancedMesh>(null), B = useRef<THREE.InstancedMesh>(null), H = useRef<THREE.InstancedMesh>(null), M = useRef<THREE.InstancedMesh>(null);
  const t = useMemo(() => ({ P: new THREE.Matrix4(), W: new THREE.Matrix4(), loc: new THREE.Matrix4().makeTranslation(-0.06, 0, 0.03), pos: new THREE.Vector3(), esc: new THREE.Vector3(), q: new THREE.Quaternion(), eixo: new THREE.Vector3(0, 1, 0), zero: new THREE.Matrix4().makeScale(0, 0, 0) }), []);

  useLayoutEffect(() => {
    ps.forEach((p, i) => {
      A.current?.setColorAt(i, new THREE.Color(p.camisa)); B.current?.setColorAt(i, new THREE.Color(p.camisa));
      H.current?.setColorAt(i, new THREE.Color(p.pele)); M.current?.setColorAt(i, new THREE.Color(ROUPAS[(i * 2 + 1) % ROUPAS.length]));
    });
    [A, B, H, M].forEach(r => { if (r.current?.instanceColor) r.current.instanceColor.needsUpdate = true; });
  }, [ps]);

  useFrame(() => {
    const tempo = movimento ? agora() : 5;
    ps.forEach((p, i) => {
      const s = estadoRota(p.c, tempo), anda = s.visivel && !s.parado, e = s.visivel ? s.esc : 0.0001;
      const ciclo = Math.sin(tempo * 8 + p.fase);
      t.pos.set(s.x, CHAO + (anda ? Math.abs(ciclo) * 0.003 : 0), s.z); t.q.setFromAxisAngle(t.eixo, s.rot); t.esc.set(e, e, e);
      t.P.compose(t.pos, t.q, t.esc);
      const usaA = !anda || ciclo > 0;
      A.current?.setMatrixAt(i, usaA ? t.P : t.zero); B.current?.setMatrixAt(i, usaA ? t.zero : t.P);
      H.current?.setMatrixAt(i, t.P);
      if (p.mala) { t.W.multiplyMatrices(t.P, t.loc); M.current?.setMatrixAt(i, t.W); } else M.current?.setMatrixAt(i, t.zero);
    });
    [A, B, H, M].forEach(r => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
  });

  const n = ps.length;
  return (
    <group key={n}>
      <instancedMesh ref={A} args={[g.A, undefined, n]} frustumCulled={false} castShadow><meshStandardMaterial vertexColors roughness={0.8} /></instancedMesh>
      <instancedMesh ref={B} args={[g.B, undefined, n]} frustumCulled={false} castShadow><meshStandardMaterial vertexColors roughness={0.8} /></instancedMesh>
      <instancedMesh ref={H} args={[g.cabeca, undefined, n]} frustumCulled={false}><meshStandardMaterial vertexColors roughness={0.6} /></instancedMesh>
      <instancedMesh ref={M} args={[g.mala, undefined, n]} frustumCulled={false}><meshStandardMaterial vertexColors roughness={0.5} /></instancedMesh>
    </group>
  );
}

/* ---------------- CARROS: 3 chamadas por modelo ---------------- */
type Def = { rota: Rota; cor: string };
let MC: THREE.MeshStandardMaterial | null = null, MR: THREE.MeshStandardMaterial | null = null, ML: THREE.MeshBasicMaterial | null = null;
const matCarro = () => (MC ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.5 }));
const matRoda = () => (MR ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }));
const matLuz = () => (ML ??= new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));

export function FrotaCarros({ defs, tipo, movimento, escala = 0.27 }: { defs: Def[]; tipo: TipoCarro; movimento: boolean; escala?: number }) {
  const comp = useMemo(() => defs.map(d => compilar(d.rota)), [defs]);
  const g = useMemo(() => criarCarro(tipo), [tipo]);
  const corpo = useRef<THREE.InstancedMesh>(null), rodas = useRef<THREE.InstancedMesh>(null), lumes = useRef<THREE.InstancedMesh>(null);
  const t = useMemo(() => ({ M: new THREE.Matrix4(), W: new THREE.Matrix4(), pos: new THREE.Vector3(), q: new THREE.Quaternion(), esc: new THREE.Vector3(), eixo: new THREE.Vector3(0, 1, 0) }), []);
  useLayoutEffect(() => {
    defs.forEach((d, i) => corpo.current?.setColorAt(i, new THREE.Color(d.cor)));
    if (corpo.current?.instanceColor) corpo.current.instanceColor.needsUpdate = true;
  }, [defs]);
  useFrame(() => {
    const tempo = movimento ? agora() : 5;
    comp.forEach((c, i) => {
      const s = estadoRota(c, tempo), e = s.visivel ? escala : 0.0001;
      t.pos.set(s.x, CHAO, s.z); t.q.setFromAxisAngle(t.eixo, s.rot); t.esc.set(e, e, e);
      t.M.compose(t.pos, t.q, t.esc);
      corpo.current?.setMatrixAt(i, t.M); lumes.current?.setMatrixAt(i, t.M);
      g.locais.forEach((loc, j) => { t.W.multiplyMatrices(t.M, loc); rodas.current?.setMatrixAt(i * 4 + j, t.W); });
    });
    [corpo, rodas, lumes].forEach(r => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
  });
  const n = defs.length;
  return (
    <group key={n}>
      <instancedMesh ref={corpo} args={[g.corpo, matCarro(), n]} frustumCulled={false} castShadow />
      <instancedMesh ref={rodas} args={[g.rodas, matRoda(), n * 4]} frustumCulled={false} />
      <instancedMesh ref={lumes} args={[g.lumes, matLuz(), n]} frustumCulled={false} />
    </group>
  );
}

const CORES = ["#c7ccd4", "#1d2230", "#a4161a", "#3d5f9c", "#e8e8e8", "#6b7280", "#1b998b", "#f3a712", "#ffffff", "#7a3b2e"];
const TIPOS: TipoCarro[] = ["sedan", "suv", "sedan", "pickup", "suv", "van", "sedan", "suv"];
type DefT = Def & { tipo: TipoCarro };
const porTipo = (defs: DefT[]) => { const m = new Map<TipoCarro, Def[]>(); defs.forEach(d => m.set(d.tipo, [...(m.get(d.tipo) ?? []), { rota: d.rota, cor: d.cor }])); return [...m.entries()]; };

export function Carros({ movimento, dens, br }: { movimento: boolean; dens: number; br: boolean }) {
  const grupos = useMemo(() => {
    const r = rng(23), d: DefT[] = [];
    // BR ao norte (fora do terreno): duas faixas; visitantes entram pela via de acesso e estacionam; táxis param na porta do terminal
    for (let i = 0; i < 9; i++) d.push({ tipo: TIPOS[i % 8], cor: CORES[(i * 3) % 10], rota: { pts: [[-110, -21.75], [110, -21.75]], vel: 1.3 + r() * 0.4, fase: i * 16 + r() * 6 } });
    for (let i = 0; i < 9; i++) d.push({ tipo: TIPOS[(i + 3) % 8], cor: CORES[(i * 7 + 1) % 10], rota: { pts: [[110, -21.45], [-110, -21.45]], vel: 1.3 + r() * 0.4, fase: i * 16 + 8 + r() * 6 } });
    for (let i = 0; i < 8; i++) { const xs = -6.9 + i * 0.45; d.push({ tipo: TIPOS[(i + 1) % 8], cor: CORES[(i * 2 + 3) % 10], rota: { pts: [[-40, -21.75], [-2.2, -21.75], [-2.2, -13.7], [-3.2, -13.7], [xs, -13.7], [-3.0, -13.7], [-1.8, -13.7], [-1.8, -21.45], [60, -21.45]], vel: 1.4, espera: { 4: 25 + r() * 40 }, pausa: 6 + r() * 20, fase: r() * 90 } }); }
    for (let i = 0; i < 3; i++) d.push({ tipo: "sedan", cor: i === 0 ? "#f3a712" : CORES[(i + 4) % 10], rota: { pts: [[-40, -21.75], [-2.2, -21.75], [-2.2, -11.5], [-1.8, -11.5], [-1.8, -21.45], [60, -21.45]], vel: 1.4, espera: { 2: 12 + r() * 10 }, pausa: 25 + r() * 30, fase: r() * 80 } });
    return porTipo(amostra(d, dens));
  }, [dens]);
  if (!br) return null;
  return <>{grupos.map(([tipo, defs]) => <FrotaCarros key={tipo} tipo={tipo} defs={defs} movimento={movimento} />)}</>;
}

export function CarrosParados({ dens }: { dens: number }) {
  const grupos = useMemo(() => {
    const r = rng(5), d: DefT[] = [];
    [-14.6, -12.75].forEach(z => { for (let x = -6.9; x <= -3.0; x += 0.17) { if (r() < 0.5) d.push({ tipo: TIPOS[Math.floor(r() * 8)], cor: CORES[Math.floor(r() * 10)], rota: { pts: [[x, z]], vel: 1, rot: Math.PI / 2 } }); } });
    return porTipo(amostra(d, Math.max(dens, 0.5)));
  }, [dens]);
  return <>{grupos.map(([tipo, defs]) => <FrotaCarros key={tipo} tipo={tipo} defs={defs} movimento={false} escala={0.2} />)}</>;
}

export function Apoio({ movimento }: { movimento: boolean }) {
  const defs = useMemo<Def[]>(() => [0, 1, 2].map(i => ({ cor: i === 0 ? "#ffc400" : "#8d99a8", rota: { pts: [[-9, 2.5], [2, 2.5], [-9, 2.5]] as P2[], vel: 0.45, espera: { 1: 6 }, pausa: 4, fase: -i * 0.55 } })), []);
  const comp = useMemo(() => defs.map(d => compilar(d.rota)), [defs]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => { defs.forEach((d, i) => ref.current?.setColorAt(i, new THREE.Color(d.cor))); if (ref.current?.instanceColor) ref.current.instanceColor.needsUpdate = true; }, [defs]);
  useFrame(() => {
    const t = movimento ? agora() : 5;
    comp.forEach((c, i) => { const s = estadoRota(c, t), e = s.visivel ? 1 : 0.0001; o.position.set(s.x, CHAO + 0.035, s.z); o.rotation.set(0, s.rot, 0); o.scale.set(e, e, e); o.updateMatrix(); ref.current?.setMatrixAt(i, o.matrix); });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, defs.length]} frustumCulled={false} castShadow><boxGeometry args={[0.2, 0.07, 0.1]} /><meshStandardMaterial roughness={0.5} /></instancedMesh>;
}
