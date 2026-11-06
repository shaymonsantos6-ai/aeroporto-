import type { Resultado } from "./calculos";
const CHAVE = "tchutchucos:memorial:v1";

export function ler(): Resultado[] {
  try { return JSON.parse(localStorage.getItem(CHAVE) ?? "[]") as Resultado[]; } catch { return []; }
}
export function registrar(r: Resultado) { localStorage.setItem(CHAVE, JSON.stringify([...ler(), r])); }
export function limpar() { localStorage.removeItem(CHAVE); }
