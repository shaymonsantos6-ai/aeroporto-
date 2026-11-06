"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, Sky, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import Aeroporto, { type Camadas, type Visao } from "./Aeroporto";
import Jogador, { type Joy } from "./Jogador";
import type { InfoJogador } from "./Radar";
import { S, porId, caixaDe } from "@/lib/dados";
import { SPAWN } from "@/lib/layout";
import { dentroHangar, dentroTerminal } from "@/lib/colisao";

type V3 = [number, number, number];
export type Hora = "dia" | "tarde" | "noite";
// Um ponto de câmera por seção da página. A primeira vista imita o ângulo da foto da maquete.
const KP: V3[] = [[-30, 22, 28], [-8, 9, 24], [28, 28, 34], [0, 62, 3], [24, 3.5, 10], [-6, 6, -2], [-30, 14, -10]];
const KA: V3[] = [[4, 0, -2], [0, 0, 0], [0, 0, 0], [0, 0, 0.5], [17.5, 0, 0], [-2, 2, -9], [0, 0, 0]];
const curvaP = new THREE.CatmullRomCurve3(KP.map(p => new THREE.Vector3(...p)));
const curvaA = new THREE.CatmullRomCurve3(KA.map(p => new THREE.Vector3(...p)));

const PRE = {
  dia: { sol: [100, 55, 20] as V3, luzDir: [100, 55, 20] as V3, turb: 3.5, ray: 1.6, fog: "#a9c4e6", dens: 0.0035, luz: "#fff3dd", li: 3.2, hs: "#bcd6ff", hg: "#3b5a3f", hi: 1.15, estrelas: 0 },
  tarde: { sol: [120, 7, 20] as V3, luzDir: [90, 24, 30] as V3, turb: 7, ray: 1.4, fog: "#26385f", dens: 0.0065, luz: "#ffae63", li: 2.4, hs: "#7f9fe0", hg: "#1a2a22", hi: 0.9, estrelas: 700 },
  noite: { sol: [100, -12, 20] as V3, luzDir: [-50, 60, 30] as V3, turb: 10, ray: 0.4, fog: "#060c18", dens: 0.008, luz: "#6f8fd0", li: 0.7, hs: "#2c4690", hg: "#08110d", hi: 0.6, estrelas: 2000 },
  maquete: { sol: [0, 0, 0] as V3, luzDir: [-30, 45, 35] as V3, turb: 0, ray: 0, fog: "#2b1f17", dens: 0, luz: "#fff3e0", li: 2.6, hs: "#fff1dc", hg: "#5a4636", hi: 1.0, estrelas: 0 },
};

function foco(id: string) {
  const e = porId(id);
  if (!e) return null;
  const b = caixaDe(e), cx = ((b.x0 + b.x1) / 2) * S, cz = ((b.z0 + b.z1) / 2) * S, w = (b.x1 - b.x0) * S, d = (b.z1 - b.z0) * S, m = Math.max(w, d);
  return { pos: new THREE.Vector3(cx + 4 + m * 0.25, 4 + m * 0.35, cz + 8 + d * 0.5), alvo: new THREE.Vector3(cx, 0.3, cz) };
}

type Modo = "tour" | "explorar";
type Cam = { pos: React.RefObject<THREE.Vector3>; az: React.RefObject<number>; pitch: React.RefObject<number> };

function Rig({ progresso, selecionado, reduzido, modo, cam, info }: { progresso: React.RefObject<number>; selecionado: string | null; reduzido: boolean; modo: Modo; cam: Cam; info: React.RefObject<InfoJogador> }) {
  const { camera } = useThree();
  const alvo = useRef(new THREE.Vector3(...KA[0]));
  const p = useMemo(() => new THREE.Vector3(), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const f = useMemo(() => (selecionado ? foco(selecionado) : null), [selecionado]);
  useFrame((_, dt) => {
    const cam3 = camera as THREE.PerspectiveCamera;
    const near = modo === "explorar" ? 0.05 : 0.2;   // evita tremida (z-fighting) de faixas e pisos
    if (cam3.near !== near) { cam3.near = near; cam3.updateProjectionMatrix(); }
    let dp: THREE.Vector3, da: THREE.Vector3, k: number;
    const j = cam.pos.current;
    info.current.x = j.x; info.current.z = j.z; info.current.az = cam.az.current ?? 0;
    if (modo === "explorar") {
      const dentro = dentroTerminal(j.x, j.z) || dentroHangar(j.x, j.z);
      const d = dentro ? 0.5 : 1.05, ph = dentro ? Math.max(cam.pitch.current ?? 0.4, 0.55) : cam.pitch.current ?? 0.38, az = cam.az.current ?? 0;
      a.set(j.x, 0.1, j.z);
      p.set(j.x + Math.sin(az) * Math.cos(ph) * d, Math.max(0.09, 0.1 + Math.sin(ph) * d), j.z + Math.cos(az) * Math.cos(ph) * d);
      dp = p; da = a; k = 1 - Math.exp(-dt * 9);
    } else {
      const t = THREE.MathUtils.clamp(progresso.current ?? 0, 0, 1);
      dp = f ? f.pos : curvaP.getPoint(t, p);
      da = f ? f.alvo : curvaA.getPoint(t, a);
      k = reduzido ? 1 : 1 - Math.exp(-dt * 3.2);
    }
    camera.position.lerp(dp, k);
    alvo.current.lerp(da, k);
    camera.lookAt(alvo.current);
  });
  return null;
}

function ControleCamera({ ativo, cam }: { ativo: boolean; cam: Cam }) {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = ativo ? "none" : "";
    if (!ativo) return;
    let x = 0, y = 0;
    const down = (e: PointerEvent) => { x = e.clientX; y = e.clientY; };
    const move = (e: PointerEvent) => {
      if (!(e.buttons & 1)) return;
      cam.az.current -= (e.clientX - x) * 0.006;
      cam.pitch.current = Math.min(1.2, Math.max(0.12, cam.pitch.current + (e.clientY - y) * 0.004));
      x = e.clientX; y = e.clientY;
    };
    const tecla = (e: KeyboardEvent) => { if (e.code === "KeyQ") cam.az.current += 0.15; if (e.code === "KeyR") cam.az.current -= 0.15; };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); window.addEventListener("keydown", tecla);
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); window.removeEventListener("keydown", tecla); el.style.touchAction = ""; };
  }, [ativo, gl, cam]);
  return null;
}

function Sol({ pre, explorar, pos, sombras }: { pre: (typeof PRE)["dia"]; explorar: boolean; pos: React.RefObject<THREE.Vector3>; sombras: boolean }) {
  const luz = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  const dir = useMemo(() => new THREE.Vector3(...pre.luzDir).normalize(), [pre]);
  useEffect(() => { const l = luz.current; if (!l) return; scene.add(l.target); return () => { scene.remove(l.target); }; }, [scene]);
  useFrame(() => {
    const l = luz.current;
    if (!l) return;
    const cx = explorar ? pos.current.x : 0, cz = explorar ? pos.current.z : 0, b = explorar ? 6 : 36, c = l.shadow.camera;
    if (c.right !== b) { c.left = -b; c.right = b; c.top = b; c.bottom = -b; c.near = 1; c.far = 200; c.updateProjectionMatrix(); }
    l.target.position.set(cx, 0, cz); l.target.updateMatrixWorld();
    l.position.set(cx + dir.x * 80, dir.y * 80, cz + dir.z * 80);
  });
  return <directionalLight ref={luz} color={pre.luz} intensity={pre.li} castShadow={sombras} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} shadow-normalBias={0.02} />;
}

type Props = {
  progresso: React.RefObject<number>; camadas: Camadas; selecionado: string | null; rotulos: boolean; reduzido: boolean;
  modo: Modo; joy: React.RefObject<Joy>; hora: Hora; visao: Visao; nivel: number; onNivel: (n: number) => void; info: React.RefObject<InfoJogador>;
  onSelecionar: (id: string) => void; onPronto: () => void; onProximo: (id: string | null) => void;
};

export default function AirportCanvas({ progresso, camadas, selecionado, rotulos, reduzido, modo, joy, hora, visao, nivel, onNivel, info, onSelecionar, onPronto, onProximo }: Props) {
  const pos = useRef(new THREE.Vector3(SPAWN.x, 0, SPAWN.z));
  const az = useRef(Math.PI), pitch = useRef(0.38);
  const inicio = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const cam = useMemo<Cam>(() => ({ pos, az, pitch }), []);
  const explorar = modo === "explorar";
  const maq = visao === "maquete";
  const pre = maq ? PRE.maquete : PRE[hora];
  const dprMax = nivel >= 2 ? 2 : nivel === 1 ? 1.25 : 1;
  return (
    <Canvas shadows="soft" camera={{ position: KP[0], fov: 50, near: 0.2, far: 4000 }} dpr={[1, dprMax]} gl={{ antialias: nivel >= 1, powerPreference: "high-performance" }} onCreated={() => onPronto()}>
      <PerformanceMonitor flipflops={3} onDecline={() => { if (performance.now() - inicio.current > 6000 && nivel > 0) onNivel(nivel - 1); }} />
      <color attach="background" args={[pre.fog]} />
      {!maq && <fogExp2 attach="fog" args={[pre.fog, pre.dens]} />}
      {!maq && <Sky distance={3000} sunPosition={pre.sol} turbidity={pre.turb} rayleigh={pre.ray} mieCoefficient={0.01} mieDirectionalG={0.92} />}
      {!maq && pre.estrelas > 0 && nivel >= 1 && <Stars radius={300} depth={40} count={pre.estrelas} factor={4} fade speed={0} />}
      <hemisphereLight args={[pre.hs, pre.hg, pre.hi]} />
      <Sol pre={pre} explorar={explorar} pos={pos} sombras={nivel >= 2} />
      <Aeroporto camadas={camadas} selecionado={selecionado} rotulos={rotulos && !explorar} movimento={!reduzido} posRef={pos} nivel={nivel} hora={hora} visao={visao} onSelecionar={onSelecionar} />
      <Jogador ativo={explorar} pos={pos} az={az} joy={joy} onProximo={onProximo} />
      <ControleCamera ativo={explorar} cam={cam} />
      <Rig progresso={progresso} selecionado={explorar ? null : selecionado} reduzido={reduzido} modo={modo} cam={cam} info={info} />
    </Canvas>
  );
}
