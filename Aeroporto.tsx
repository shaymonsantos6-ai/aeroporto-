"use client";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Edges, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { criarMundo } from "@/lib/cena/mundo";
import { CHAO } from "@/lib/cena/construtor";
import { ruido, matBrilho } from "./texturas";
import { Aviao, ALTURA_SOLO, alturaSolo, useMamute } from "./Aviao";
import { Apoio, Carros, CarrosParados, Pessoas } from "./Vida";
import Interior from "./Interior";
import { ELEMENTOS, DRENAGEM, TAXIS, LARG_TAXI, S, porId, caixaDe } from "@/lib/dados";
import { PARADOS, POUSO, PISTA_X } from "@/lib/layout";
import { H1, H2, TERM, dentroHangar, dentroTerminal } from "@/lib/colisao";
import { criarTrajeto, suavizar } from "@/lib/trajeto";
import { agora, CICLO_DEC, OFF_DEC, CICLO_POU, OFF_POU, destinoSaida, numeroSaida, numeroChegada, origemChegada, nomeCidade } from "@/lib/voos";

export type Camadas = { aeronaves: boolean; iluminacao: boolean; vegetacao: boolean; edificios: boolean; drenagem: boolean; vida: boolean };
export type Visao = "maquete" | "real";
type P3 = [number, number, number];
const mod = (a: number, n: number) => ((a % n) + n) % n;
const TRAJ_POUSO = criarTrajeto(suavizar(POUSO, 3));

function Etiqueta({ texto }: { texto: string }) {
  if (!texto) return null;
  return <Html center position={[0, 0.75, 0]} zIndexRange={[4, 0]}><span className="etiqueta-voo">{texto}</span></Html>;
}

// decolagem e pouso seguem o eixo da pista (norte-sul na maquete); o pouso sai pelo táxi Alfa até o pátio
function AvioesMoveis({ movimento, maquete }: { movimento: boolean; maquete: boolean }) {
  const dec = useRef<THREE.Group>(null), pou = useRef<THREE.Group>(null), cir = useRef<THREE.Group>(null);
  const [txtDec, setTxtDec] = useState(""), [txtPou, setTxtPou] = useState("");
  const kd = useRef(-9999), kp = useRef(-9999), vis = useRef(true);
  useFrame(() => {
    const t = movimento ? agora() : 9;
    const d = dec.current;
    if (d) {
      const u = mod(t + OFF_DEC, CICLO_DEC) / CICLO_DEC, k = Math.floor((t + OFF_DEC) / CICLO_DEC);
      if (k !== kd.current) { kd.current = k; setTxtDec(`${numeroSaida(k)} → ${nomeCidade(destinoSaida(k))}`); }
      let z = 15.5, y = ALTURA_SOLO, pitch = 0;
      if (u >= 0.14 && u < 0.5) { const s = (u - 0.14) / 0.36; z = 15.5 - 31 * s * s; if (s > 0.88) pitch = 0.25 * ((s - 0.88) / 0.12); }
      else if (u >= 0.5) { const q = (u - 0.5) / 0.5; z = -15.5 - 170 * q; y = ALTURA_SOLO + 0.1 + 55 * q * q + 5 * q; pitch = Math.min(0.45, Math.atan2(110 * q + 5, 170)); }
      d.position.set(PISTA_X, y, z); d.rotation.set(0, Math.PI / 2, pitch); d.scale.setScalar(Math.max(0.001, Math.min(1, u / 0.04)));
    }
    const g = pou.current;
    if (g) {
      const u = mod(t + OFF_POU, CICLO_POU) / CICLO_POU, k = Math.floor((t + OFF_POU) / CICLO_POU);
      if (k !== kp.current) { kp.current = k; setTxtPou(`${numeroChegada(k)} ← ${nomeCidade(origemChegada(k))}`); }
      let x = PISTA_X, y = ALTURA_SOLO, z = 14, yaw = Math.PI / 2, pitch = 0, esc = 1;
      if (u < 0.28) { const p = u / 0.28; z = 14 + 96 * (1 - p); y = ALTURA_SOLO + 6.5 * (1 - p); pitch = p > 0.9 ? 0.03 : -0.075; }
      else if (u < 0.8) {
        const w = (u - 0.28) / 0.52, f = 1 - Math.pow(1 - w, 1.7), st = TRAJ_POUSO.em(f * TRAJ_POUSO.len);
        x = st.x; z = st.z; yaw = st.rot;
        if (u > 0.76) esc = Math.max(0.001, (0.8 - u) / 0.04);
      } else esc = 0.001;
      const visivel = u < 0.8;
      if (visivel !== vis.current) { vis.current = visivel; setTxtPou(visivel ? `${numeroChegada(k)} ← ${nomeCidade(origemChegada(k))}` : ""); }
      g.position.set(x, y, z); g.rotation.set(0, yaw, pitch); g.scale.setScalar(esc);
    }
    const c = cir.current;
    if (c) { const a = t * 0.06; c.position.set(95 * Math.cos(a), 16 + 2.5 * Math.sin(a * 3), 95 * Math.sin(a)); c.rotation.set(0, -(a + Math.PI / 2), 0); }
  });
  return (
    <>
      <group ref={dec}><Aviao animado cauda="#087BFF" /><Etiqueta texto={txtDec} /></group>
      <group ref={pou}><Aviao animado cauda="#8BCBFF" /><Etiqueta texto={txtPou} /></group>
      {!maquete && <group ref={cir}><Aviao trilha escala={1.4} cauda="#087BFF" /></group>}
    </>
  );
}

const rectU = (id: string) => { const b = caixaDe(porId(id)!); return { cx: ((b.x0 + b.x1) / 2) * S, cz: ((b.z0 + b.z1) / 2) * S, w: (b.x1 - b.x0) * S, d: (b.z1 - b.z0) * S }; };

function Destaque({ id }: { id: string }) {
  const e = porId(id);
  const ref = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.opacity = 0.1 + 0.07 * Math.sin(clock.elapsedTime * 3); });
  if (!e) return null;
  const r = rectU(id), h = Math.max(e.altura * S, 0.1);
  return (
    <mesh position={[r.cx, h / 2, r.cz]}>
      <boxGeometry args={[r.w + 0.25, h + 0.15, r.d + 0.25]} />
      <meshBasicMaterial ref={ref} color="#087BFF" transparent opacity={0.15} depthWrite={false} />
      <Edges color="#8BCBFF" />
    </mesh>
  );
}

function Cotas3D({ id }: { id: string }) {
  const e = porId(id);
  if (!e) return null;
  const r = rectU(id), h = Math.max(e.altura * S, 0.08), y = h + 0.08;
  const f = (n: number) => `${Math.round(n / S).toLocaleString("pt-BR")} m`;
  const L1: P3[] = [[r.cx - r.w / 2, y, r.cz - r.d / 2 - 0.35], [r.cx + r.w / 2, y, r.cz - r.d / 2 - 0.35]];
  const L2: P3[] = [[r.cx + r.w / 2 + 0.35, y, r.cz - r.d / 2], [r.cx + r.w / 2 + 0.35, y, r.cz + r.d / 2]];
  const L3: P3[] = [[r.cx - r.w / 2 - 0.3, 0.02, r.cz - r.d / 2 - 0.3], [r.cx - r.w / 2 - 0.3, h, r.cz - r.d / 2 - 0.3]];
  const rot = (txt: string, p: P3) => <Html position={p} center zIndexRange={[6, 0]}><span className="cota">{txt}</span></Html>;
  return (
    <group>
      <Line points={L1} color="#ffd23f" lineWidth={2} /><Line points={L2} color="#ffd23f" lineWidth={2} />
      {rot(f(r.w), [r.cx, y + 0.05, r.cz - r.d / 2 - 0.35])}{rot(f(r.d), [r.cx + r.w / 2 + 0.35, y + 0.05, r.cz])}
      {e.altura >= 1 && (<><Line points={L3} color="#ffd23f" lineWidth={2} />{rot(`${e.altura} m`, [L3[0][0], h / 2, L3[0][2]])}</>)}
    </group>
  );
}

function Numeral({ texto, z, rot }: { texto: string; z: number; rot: number }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 192;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f5f8fc"; g.font = "bold 150px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(texto, 128, 100);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [texto]);
  return (
    <mesh position={[PISTA_X, CHAO + 0.009, z]} rotation={[-Math.PI / 2, 0, rot]}>
      <planeGeometry args={[2.0, 1.5]} /><meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

// Base de maquete: moldura preta, plaquinha e mesa de madeira (como na foto de referência)
function Base() {
  const mamute = useMamute();
  const { placa, madeira } = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 160;
    const g = c.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, "#d9dde3"); gr.addColorStop(1, "#9aa1ab");
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 160);
    g.fillStyle = "#14171c"; g.font = "bold 54px sans-serif"; g.textBaseline = "middle"; g.fillText("AEROPORTO OS TCHUTCHUCOS", 190, 62);
    g.font = "28px sans-serif"; g.fillText("ESTUDANTES DE ENGENHARIA UDF", 190, 118);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = ruido("#8a6a4f", 0.3); m.repeat.set(6, 6);
    return { placa: t, madeira: m };
  }, []);
  const W = 50, D = 38, E = 1.2;
  return (
    <group>
      <mesh position={[0, -0.27, 0]}><boxGeometry args={[W + 2 * E, 0.5, D + 2 * E]} /><meshStandardMaterial color="#14171c" roughness={0.6} /></mesh>
      {[[0, -(D / 2 + E / 2), W + 2 * E, E], [0, D / 2 + E / 2, W + 2 * E, E]].map(([x, z, w, d], i) => (<mesh key={i} position={[x, 0.2, z]}><boxGeometry args={[w, 0.5, d]} /><meshStandardMaterial color="#14171c" roughness={0.6} /></mesh>))}
      {[-1, 1].map(s => (<mesh key={s} position={[s * (W / 2 + E / 2), 0.2, 0]}><boxGeometry args={[E, 0.5, D]} /><meshStandardMaterial color="#14171c" roughness={0.6} /></mesh>))}
      <mesh position={[0, 0.0, D / 2 + E + 0.002]}><planeGeometry args={[14, 0.55]} /><meshBasicMaterial map={placa} toneMapped={false} /></mesh>
      <mesh position={[-5.6, 0.0, D / 2 + E + 0.004]}><planeGeometry args={[0.5, 0.45]} /><meshBasicMaterial map={mamute} transparent toneMapped={false} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.55, 0]}><planeGeometry args={[400, 400]} /><meshStandardMaterial map={madeira} color="#9b7a5c" roughness={0.7} /></mesh>
    </group>
  );
}

type Props = {
  camadas: Camadas; selecionado: string | null; rotulos: boolean; movimento: boolean;
  posRef: React.RefObject<THREE.Vector3>; nivel: number; hora: "dia" | "tarde" | "noite"; visao: Visao;
  onSelecionar: (id: string) => void;
};

export default function Aeroporto({ camadas, selecionado, rotulos, movimento, posRef, nivel, hora, visao, onSelecionar }: Props) {
  const M = useMemo(criarMundo, []);
  const mats = useMemo(() => {
    const det = ruido("#e8e8e8", 0.25);
    const g1 = ruido("#e6e6e6", 0.35); g1.repeat.set(300, 300);
    const g2 = ruido("#e6e6e6", 0.35); g2.repeat.set(30, 23);
    const casca = (side: THREE.Side) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, transparent: true, side });
    return {
      chao: new THREE.MeshStandardMaterial({ vertexColors: true, map: det, roughness: 0.88 }),
      edif: new THREE.MeshStandardMaterial({ vertexColors: true, map: det, roughness: 0.6, metalness: 0.08 }),
      basico: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
      casca: casca(THREE.FrontSide), hangar: casca(THREE.DoubleSide),
      vidro: new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.7, depthWrite: false }),
      montanhas: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }),
      arvores: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }),
      relva1: new THREE.MeshStandardMaterial({ color: "#12301f", roughness: 1, map: g1 }),
      relva2: new THREE.MeshStandardMaterial({ color: "#2f5a35", roughness: 1, map: g2 }),
    };
  }, []);
  const luzesP = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(M.luzesP.pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(M.luzesP.cor, 3)); return g; }, [M]);
  const luzesG = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(M.luzesG.pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(M.luzesG.cor, 3)); return g; }, [M]);
  const arv = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = arv.current;
    if (!m) return;
    M.arvores.forEach((mx, i) => { m.setMatrixAt(i, mx); m.setColorAt(i, new THREE.Color(M.tons[i])); });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [M, camadas.vegetacao]);

  useFrame((_, dt) => {
    const p = posRef.current, k = Math.min(1, dt * 6);
    mats.casca.opacity += ((dentroTerminal(p.x, p.z) ? 0.08 : 1) - mats.casca.opacity) * k; mats.casca.depthWrite = mats.casca.opacity > 0.9;
    mats.hangar.opacity += ((dentroHangar(p.x, p.z) ? 0.08 : 1) - mats.hangar.opacity) * k; mats.hangar.depthWrite = mats.hangar.opacity > 0.9;
  });

  const sel = (id: string) => ({
    onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelecionar(id); },
    onPointerOver: () => { document.body.style.cursor = "pointer"; },
    onPointerOut: () => { document.body.style.cursor = ""; },
  });
  const maq = visao === "maquete";
  const noite = hora !== "dia" && !maq, luz = camadas.iluminacao && (noite || maq), ed = camadas.edificios;
  const dens = nivel === 0 ? 0.45 : 1;
  const taxiSegs = useMemo(() => TAXIS.flatMap(t => t.pts.slice(1).map((q, i) => {
    const a = t.pts[i], dx = (q[0] - a[0]) * S, dz = (q[1] - a[1]) * S;
    return { key: `${t.id}${i}`, x: ((a[0] + q[0]) / 2) * S, z: ((a[1] + q[1]) / 2) * S, len: Math.hypot(dx, dz), rot: -Math.atan2(dz, dx) };
  })), []);

  return (
    <group>
      {luz && nivel >= 1 && <pointLight position={[TERM.cx, 0.55, TERM.cz]} color="#ffe2b8" intensity={10} distance={7} decay={2} />}
      {luz && nivel >= 1 && <pointLight position={[H1.cx, 0.45, H1.cz]} color="#fff0d0" intensity={6} distance={5} decay={2} />}
      {luz && nivel >= 1 && <pointLight position={[H2.cx, 0.45, H2.cz]} color="#fff0d0" intensity={6} distance={5} decay={2} />}

      {maq ? <Base /> : <mesh rotation-x={-Math.PI / 2} position={[0, -0.003, 0]} material={mats.relva1} receiveShadow><planeGeometry args={[1200, 1200]} /></mesh>}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]} material={mats.relva2} receiveShadow><planeGeometry args={[50, 38]} /></mesh>
      <mesh geometry={M.chao} material={mats.chao} castShadow receiveShadow />
      {!maq && <mesh geometry={M.externo} material={mats.chao} receiveShadow />}
      {!maq && <mesh geometry={M.montanhas} material={mats.montanhas} />}
      {camadas.vegetacao && <instancedMesh ref={arv} args={[M.arvoresGeo, mats.arvores, M.arvores.length]} castShadow />}
      {ed && (
        <>
          <mesh geometry={M.edif} material={mats.edif} castShadow receiveShadow />
          <mesh geometry={M.basico} material={mats.basico} />
          <mesh geometry={M.casca} material={mats.casca} castShadow receiveShadow />
          <mesh geometry={M.vidro} material={mats.vidro} />
          <mesh geometry={M.hangar} material={mats.hangar} castShadow receiveShadow />
          <Interior movimento={movimento} cx={TERM.cx} cz={TERM.cz} />
        </>
      )}
      <Numeral texto="27" z={12.4} rot={0} /><Numeral texto="09" z={-13.4} rot={Math.PI} />
      {luz && <points geometry={luzesP} material={matBrilho(0.34)} />}
      {luz && <points geometry={luzesG} material={matBrilho(1.1)} />}

      {/* áreas clicáveis (invisíveis) */}
      {ELEMENTOS.filter(e => e.tipo !== "rede" && !(maq && e.id === "acesso" && false)).map(e => {
        const h = Math.max(e.altura * S, 0.08), r = rectU(e.id);
        return (
          <mesh key={e.id} position={[r.cx, h / 2, r.cz]} {...sel(e.id)}>
            <boxGeometry args={[r.w, h, r.d]} /><meshBasicMaterial visible={false} />
          </mesh>
        );
      })}
      {taxiSegs.map(s => (
        <mesh key={s.key} position={[s.x, 0.05, s.z]} rotation={[0, s.rot, 0]} {...sel("taxiway")}>
          <boxGeometry args={[s.len + 0.2, 0.1, LARG_TAXI * S]} /><meshBasicMaterial visible={false} />
        </mesh>
      ))}

      {camadas.drenagem && (
        <group>
          {DRENAGEM.linhas.map((l, i) => (<Line key={i} points={l.map(p => [p[0] * S, 0.09, p[1] * S] as P3)} color="#3aa0ff" lineWidth={2} />))}
          <mesh rotation-x={-Math.PI / 2} position={[DRENAGEM.bacia.centro[0] * S, 0.03, DRENAGEM.bacia.centro[1] * S]}><circleGeometry args={[DRENAGEM.bacia.raio * S, 24]} /><meshStandardMaterial color="#1d5fa8" roughness={0.2} metalness={0.3} /></mesh>
        </group>
      )}

      {camadas.aeronaves && (
        <>
          {PARADOS.map((p, i) => (
            <group key={i} position={[p.x, alturaSolo(p.escala), p.z]} rotation={[0, p.rot, 0]}><Aviao tipo={p.tipo} cauda={p.cauda} escala={p.escala} /></group>
          ))}
          <group position={[H1.cx, alturaSolo(0.8), H1.cz]} rotation={[0, -Math.PI / 2, 0]}><Aviao cauda="#087BFF" escala={0.8} /></group>
          <group position={[H2.cx, alturaSolo(0.8), H2.cz]} rotation={[0, -Math.PI / 2, 0]}><Aviao tipo="turbo" cauda="#8BCBFF" escala={0.8} /></group>
          <AvioesMoveis movimento={movimento} maquete={maq} />
        </>
      )}
      {camadas.vida && (<><Pessoas movimento={movimento} dens={dens} /><Carros movimento={movimento} dens={dens} br={!maq} /><CarrosParados dens={dens} /><Apoio movimento={movimento} /></>)}

      {selecionado && <Destaque id={selecionado} />}
      {selecionado && <Cotas3D id={selecionado} />}
      {rotulos && ELEMENTOS.map(e => (
        <Html key={e.id} position={[e.centro[0] * S, Math.max(e.altura * S, 0.2) + 0.7, e.centro[1] * S]} center zIndexRange={[5, 0]}>
          <button type="button" className="rotulo" onClick={() => onSelecionar(e.id)} aria-label={`Selecionar ${e.nome}`}>{e.nome}</button>
        </Html>
      ))}
      <group userData={{ ALTURA_SOLO }} />
    </group>
  );
}
