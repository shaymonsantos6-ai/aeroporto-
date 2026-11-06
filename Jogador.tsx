"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ELEMENTOS, S } from "@/lib/dados";
import { resolver } from "@/lib/colisao";
import { CHAO } from "@/lib/cena/construtor";

export type Joy = { x: number; y: number };
type P = { ativo: boolean; pos: React.RefObject<THREE.Vector3>; az: React.RefObject<number>; joy: React.RefObject<Joy>; onProximo: (id: string | null) => void };
type V3 = [number, number, number];
type RG = React.RefObject<THREE.Group | null>;

function B({ p, s, c, em }: { p: V3; s: V3; c: string; em?: string }) {
  return <mesh position={p} castShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={0.7} emissive={em ?? "#000"} emissiveIntensity={em ? 0.6 : 0} /></mesh>;
}
const JAQ = "#087BFF", CALCA = "#1f2d44", PELE = "#e0b08a";

export default function Jogador({ ativo, pos, az, joy, onProximo }: P) {
  const g = useRef<THREE.Group>(null), tr = useRef<THREE.Group>(null);
  const pE = useRef<THREE.Group>(null), pD = useRef<THREE.Group>(null), kE = useRef<THREE.Group>(null), kD = useRef<THREE.Group>(null);
  const bE = useRef<THREE.Group>(null), bD = useRef<THREE.Group>(null), cE = useRef<THREE.Group>(null), cD = useRef<THREE.Group>(null);
  const teclas = useRef<Record<string, boolean>>({});
  const yaw = useRef(0), fase = useRef(0), acc = useRef(0), ult = useRef<string | null>(null), rel = useRef(0);
  const caixas = useMemo(() => ELEMENTOS.map(e => ({ id: e.id, x0: (e.centro[0] - e.dim[0] / 2) * S, x1: (e.centro[0] + e.dim[0] / 2) * S, z0: (e.centro[1] - e.dim[1] / 2) * S, z1: (e.centro[1] + e.dim[1] / 2) * S })), []);

  useEffect(() => {
    const d = (e: KeyboardEvent) => { teclas.current[e.code] = true; };
    const u = (e: KeyboardEvent) => { teclas.current[e.code] = false; };
    const sai = () => { teclas.current = {}; };
    window.addEventListener("keydown", d); window.addEventListener("keyup", u); window.addEventListener("blur", sai);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); window.removeEventListener("blur", sai); };
  }, []);

  useFrame((_, dtRaw) => {
    const grp = g.current;
    if (!grp) return;
    grp.visible = ativo;
    if (!ativo) return;
    const dt = Math.min(dtRaw, 0.05), k = teclas.current, j = joy.current ?? { x: 0, y: 0 };
    let ix = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + j.x;
    let iy = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) + j.y;
    const len = Math.hypot(ix, iy);
    if (len > 1) { ix /= len; iy /= len; }
    const a = az.current ?? 0;
    const dx = -Math.sin(a) * iy + Math.cos(a) * ix, dz = -Math.cos(a) * iy - Math.sin(a) * ix;
    const corre = !!(k.ShiftLeft || k.ShiftRight) || Math.hypot(j.x, j.y) > 0.95;
    const vel = corre ? 2.6 : 1.3, anda = len > 0.05, p = pos.current;
    if (anda) { const r = resolver(p.x, p.z, dx * vel * dt, dz * vel * dt); p.x = r[0]; p.z = r[1]; }
    grp.position.set(p.x, CHAO, p.z);
    if (anda) {
      let d = Math.atan2(dx, dz) - yaw.current;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      yaw.current += d * Math.min(1, dt * 12);
      fase.current += dt * (corre ? 16 : 10);
    }
    grp.rotation.y = yaw.current;
    rel.current += dt;
    const amp = corre ? 1.05 : 0.7, sw = anda ? Math.sin(fase.current) * amp : 0, sw2 = anda ? Math.sin(fase.current + Math.PI) * amp : 0;
    const dobra = (v: number) => Math.max(0, v) * (corre ? 1.3 : 0.9);
    if (pE.current) pE.current.rotation.x = sw;
    if (pD.current) pD.current.rotation.x = sw2;
    if (kE.current) kE.current.rotation.x = dobra(sw);
    if (kD.current) kD.current.rotation.x = dobra(sw2);
    if (bE.current) bE.current.rotation.x = sw2 * 0.8;
    if (bD.current) bD.current.rotation.x = sw * 0.8;
    const cot = anda ? -(0.35 + (corre ? 0.5 : 0.15)) : -0.1;
    if (cE.current) cE.current.rotation.x = cot;
    if (cD.current) cD.current.rotation.x = cot;
    if (tr.current) { tr.current.scale.y = 1 + (anda ? 0 : Math.sin(rel.current * 2) * 0.012); tr.current.rotation.x = anda && corre ? 0.12 : 0; }
    acc.current += dt;
    if (acc.current > 0.2) {
      acc.current = 0;
      let melhor: string | null = null, md = 1.2;
      for (const b of caixas) {
        const d = Math.hypot(Math.max(b.x0 - p.x, 0, p.x - b.x1), Math.max(b.z0 - p.z, 0, p.z - b.z1));
        if (d < md) { md = d; melhor = b.id; }
      }
      if (melhor !== ult.current) { ult.current = melhor; onProximo(melhor); }
    }
  });

  const perna = (x: number, refT: RG, refK: RG) => (
    <group ref={refT} position={[x, 0.07, 0]}>
      <B p={[0, -0.0175, 0]} s={[0.03, 0.037, 0.034]} c={CALCA} />
      <group ref={refK} position={[0, -0.035, 0]}>
        <B p={[0, -0.0175, 0]} s={[0.027, 0.036, 0.031]} c={CALCA} />
        <B p={[0, -0.038, 0.006]} s={[0.031, 0.014, 0.044]} c="#1a1a1a" />
      </group>
    </group>
  );
  const braco = (x: number, refB: RG, refC: RG) => (
    <group ref={refB} position={[x, 0.138, 0]}>
      <B p={[0, -0.015, 0]} s={[0.021, 0.032, 0.025]} c={JAQ} />
      <group ref={refC} position={[0, -0.03, 0]}>
        <B p={[0, -0.015, 0]} s={[0.018, 0.03, 0.022]} c={JAQ} />
        <mesh position={[0, -0.033, 0]}><sphereGeometry args={[0.011, 8, 8]} /><meshStandardMaterial color="#222" /></mesh>
      </group>
    </group>
  );
  // Modelo deslocado +0.012 em y: as solas das botas ficam em y = 0 (exatamente sobre o piso)
  return (
    <group ref={g} scale={0.85} visible={false}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}><circleGeometry args={[0.06, 16]} /><meshBasicMaterial color="#000" transparent opacity={0.35} depthWrite={false} polygonOffset polygonOffsetFactor={-2} /></mesh>
      <group position={[0, 0.012, 0]}>
        {perna(-0.014, pE, kE)}{perna(0.014, pD, kD)}
        <group ref={tr} position={[0, 0.107, 0]}>
          <B p={[0, 0, 0]} s={[0.082, 0.074, 0.048]} c={JAQ} />
          <B p={[0, 0.012, 0.0245]} s={[0.083, 0.01, 0.004]} c="#ffd23f" em="#ffb300" />
          <B p={[0, -0.012, 0.0245]} s={[0.083, 0.01, 0.004]} c="#ffd23f" em="#ffb300" />
          <B p={[0.022, 0, 0.0245]} s={[0.009, 0.074, 0.004]} c="#ffd23f" em="#ffb300" />
          <B p={[-0.022, 0, 0.0245]} s={[0.009, 0.074, 0.004]} c="#ffd23f" em="#ffb300" />
          <B p={[0.028, 0.018, 0.0262]} s={[0.016, 0.022, 0.002]} c="#ffffff" />
          <B p={[0, 0.004, -0.04]} s={[0.052, 0.062, 0.03]} c="#182638" />
          <B p={[0, -0.036, 0]} s={[0.085, 0.012, 0.05]} c="#222" />
          <B p={[0, 0.045, 0]} s={[0.016, 0.012, 0.016]} c={PELE} />
        </group>
        <group position={[0, 0.172, 0]}>
          <mesh castShadow><sphereGeometry args={[0.03, 12, 12]} /><meshStandardMaterial color={PELE} roughness={0.6} /></mesh>
          {[-0.011, 0.011].map(x => (<mesh key={x} position={[x, 0.003, 0.0265]}><sphereGeometry args={[0.0048, 6, 6]} /><meshStandardMaterial color="#10151c" /></mesh>))}
          <mesh position={[0, 0.011, 0]}><sphereGeometry args={[0.034, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#ffd23f" roughness={0.35} metalness={0.2} /></mesh>
          <B p={[0, 0.012, 0.022]} s={[0.07, 0.005, 0.034]} c="#ffd23f" />
        </group>
        {braco(-0.054, bE, cE)}{braco(0.054, bD, cD)}
      </group>
    </group>
  );
}
