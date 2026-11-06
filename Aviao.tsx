"use client";
import { assetPath } from "@/lib/asset-path";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { criarAviao } from "@/lib/cena/aviao";
import { CHAO } from "@/lib/cena/construtor";
import { matBrilho } from "./texturas";

export function useMamute() {
  const t = useTexture(assetPath("/brand/mamute.png"));
  useMemo(() => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; }, [t]);
  return t;
}

// Altura do eixo da fuselagem com o trem de pouso apoiado EXATAMENTE no piso
export const ALTURA_SOLO = CHAO + 0.265 * 0.9;
export const alturaSolo = (escala: number) => CHAO + 0.265 * escala;

let MAT: THREE.MeshStandardMaterial | null = null;
const matCorpo = () => (MAT ??= new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.3, roughness: 0.4 }));

type P = { tipo?: "jato" | "turbo"; corpo?: string; cauda?: string; trilha?: boolean; escala?: number; animado?: boolean };

export function Aviao({ tipo = "jato", corpo = "#F5F8FC", cauda = "#087BFF", trilha = false, escala = 0.9, animado = false }: P) {
  const g = useMemo(() => criarAviao(tipo, corpo, cauda), [tipo, corpo, cauda]);
  const mamute = useMamute();
  const decal = useMemo(() => new THREE.MeshBasicMaterial({ map: mamute, transparent: true, toneMapped: false }), [mamute]);
  const luzGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(g.luzes.pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(g.luzes.cor, 3));
    return geo;
  }, [g]);
  const trem = useRef<THREE.Mesh>(null);
  const raiz = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!animado || !trem.current || !raiz.current) return;
    raiz.current.getWorldPosition(v);
    trem.current.visible = v.y < 0.9;
  });
  return (
    <group scale={escala}>
      <group ref={raiz} />
      <mesh geometry={g.corpo} material={matCorpo()} castShadow receiveShadow />
      <mesh ref={trem} geometry={g.trem} material={matCorpo()} castShadow />
      <mesh geometry={g.decal} material={decal} />
      <points geometry={luzGeo} material={matBrilho(0.22)} />
      {trilha && (
        <mesh position={[-3.4, 0, 0]}><boxGeometry args={[5.4, 0.03, 0.03]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.22} depthWrite={false} /></mesh>
      )}
    </group>
  );
}
