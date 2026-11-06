"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMamute } from "./Aviao";
import { CHAO } from "@/lib/cena/construtor";
import { agora, CICLO_DEC, OFF_DEC, destinoSaida, nomeCidade, numeroSaida } from "@/lib/voos";

function desenhar(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#04101f"; ctx.fillRect(0, 0, 512, 160);
  ctx.fillStyle = "#ffd23f"; ctx.font = "bold 17px sans-serif"; ctx.fillText("PARTIDAS · DEPARTURES", 12, 22);
  ctx.font = "bold 15px monospace";
  const k0 = Math.floor((t + OFF_DEC) / CICLO_DEC);
  for (let i = -1; i <= 3; i++) {
    const k = k0 + i, dt = k * CICLO_DEC - OFF_DEC + 0.5 * CICLO_DEC - t;
    ctx.fillStyle = dt < 0 ? "#8b9bb0" : dt < 15 ? "#35ff88" : "#ffffff";
    const st = dt < 0 ? "DECOLOU" : dt < 15 ? "EMBARQUE" : "NO HORÁRIO";
    ctx.fillText(`${numeroSaida(k)}  ${nomeCidade(destinoSaida(k)).padEnd(14)} ${dt < 0 ? "--" : Math.ceil(dt) + "s"}`.padEnd(32) + st, 12, 48 + (i + 1) * 24);
  }
}

function Quadro({ movimento, cx, cz }: { movimento: boolean; cx: number; cz: number }) {
  const { tex, ctx } = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 160;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return { tex: t, ctx: c.getContext("2d")! };
  }, []);
  const ult = useRef(-1);
  useFrame(() => {
    const t = movimento ? agora() : 5, s = Math.floor(t);
    if (s === ult.current) return;
    ult.current = s; desenhar(ctx, t); tex.needsUpdate = true;
  });
  return (
    <group position={[cx, 0.46, cz]}>
      {[0, Math.PI].map(r => (<mesh key={r} rotation={[0, r, 0]} position={[0, 0, r ? -0.006 : 0.006]}><planeGeometry args={[1.5, 0.47]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>))}
      {[-0.6, 0.6].map(x => (<mesh key={x} position={[x, 0.2, 0]}><boxGeometry args={[0.01, 0.4, 0.01]} /><meshStandardMaterial color="#aab4c3" /></mesh>))}
    </group>
  );
}

function Bagagens({ movimento, cx, cz }: { movimento: boolean; cx: number; cz: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  const N = 10, C = cx + 3.9, Z = cz - 0.5, W = 1.0, R = 0.14, LT = 2 * W + 2 * Math.PI * R, topo = CHAO + 0.036;
  const pronto = useRef(false);
  useFrame(() => {
    const m = ref.current; if (!m) return;
    const t = movimento ? agora() : 5;
    for (let i = 0; i < N; i++) {
      let s = (((t * 0.12 + (i * LT) / N) % LT) + LT) % LT, x: number, z: number, r = 0;
      if (s < W) { x = C - W / 2 + s; z = Z - R; }
      else if ((s -= W) < Math.PI * R) { const a = s / R; x = C + W / 2 + Math.sin(a) * R; z = Z - Math.cos(a) * R; r = -a; }
      else if ((s -= Math.PI * R) < W) { x = C + W / 2 - s; z = Z + R; r = -Math.PI; }
      else { s -= W; const a = s / R; x = C - W / 2 - Math.sin(a) * R; z = Z + Math.cos(a) * R; r = -Math.PI - a; }
      o.position.set(x, topo + 0.02, z); o.rotation.set(0, r, 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      if (!pronto.current) m.setColorAt(i, new THREE.Color(["#c0392b", "#2b2d42", "#3d5f9c", "#f3a712", "#1b998b"][i % 5]));
    }
    pronto.current = true;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <mesh position={[C, CHAO + 0.02, Z]}><boxGeometry args={[W, 0.04, 2 * R]} /><meshStandardMaterial color="#2b3340" metalness={0.6} roughness={0.4} /></mesh>
      {[-1, 1].map(s => (<mesh key={s} position={[C + (s * W) / 2, CHAO + 0.02, Z]}><cylinderGeometry args={[R, R, 0.04, 20]} /><meshStandardMaterial color="#2b3340" metalness={0.6} roughness={0.4} /></mesh>))}
      <mesh position={[C, CHAO + 0.042, Z]}><boxGeometry args={[W, 0.004, 2 * R - 0.02]} /><meshStandardMaterial color="#111418" roughness={0.9} /></mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}><boxGeometry args={[0.05, 0.035, 0.032]} /><meshStandardMaterial roughness={0.5} /></instancedMesh>
    </group>
  );
}

// cx, cz = centro do terminal (unidades). A fachada do mamute fica na face de acesso (norte, -z).
export default function Interior({ movimento, cx, cz }: { movimento: boolean; cx: number; cz: number }) {
  const mamute = useMamute();
  return (
    <group>
      <Quadro movimento={movimento} cx={cx} cz={cz} />
      <Bagagens movimento={movimento} cx={cx} cz={cz} />
      <mesh position={[cx, 0.56, cz - 1.29]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.9, 0.78]} /><meshBasicMaterial map={mamute} transparent toneMapped={false} /></mesh>
    </group>
  );
}
