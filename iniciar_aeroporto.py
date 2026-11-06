#!/usr/bin/env python3
"""Inicia o Aeroporto Os Tchutchucos: confere o ambiente, instala dependencias,
sobe o servidor no terminal (cmd) e abre o navegador.
Uso:  python iniciar_aeroporto.py
"""
import os, shutil, socket, subprocess, sys, time, webbrowser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
os.chdir(RAIZ)


def erro(msg):
    print(f"\nERRO: {msg}")
    input("Pressione Enter para sair...")
    sys.exit(1)


def porta_livre(p):
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", p)) != 0


def aguardar(p, limite=120):
    fim = time.time() + limite
    while time.time() < fim:
        if not porta_livre(p):
            return True
        time.sleep(1)
    return False


def main():
    print("=== AEROPORTO OS TCHUTCHUCOS - Estudantes de Engenharia UDF ===\n")
    print("[1/4] Verificando Node.js e npm...")
    node, npm = shutil.which("node"), shutil.which("npm")
    if not node or not npm:
        erro("Node.js/npm nao encontrados. Instale o Node.js LTS (18.18+) em https://nodejs.org e rode de novo.")
    print("  Node:", subprocess.run([node, "-v"], capture_output=True, text=True).stdout.strip())

    print("[2/4] Verificando arquivos do projeto...")
    for f in ("package.json", "app/page.tsx", "lib/calculos.ts"):
        if not (RAIZ / f).exists():
            erro(f"arquivo ausente: {f}. Extraia o ZIP inteiro antes de executar.")

    print("[3/4] Dependencias...")
    if not (RAIZ / "node_modules").exists():
        cmd = "ci" if (RAIZ / "package-lock.json").exists() else "install"
        print(f"  Rodando npm {cmd} (pode demorar alguns minutos)...")
        if subprocess.run([npm, cmd], shell=(os.name == "nt")).returncode != 0:
            erro("falha ao instalar dependencias. Verifique a internet e tente novamente.")
    else:
        print("  node_modules ja existe.")

    porta = next((p for p in range(3000, 3011) if porta_livre(p)), None)
    if porta is None:
        erro("nenhuma porta livre entre 3000 e 3010.")
    url = f"http://localhost:{porta}"
    print(f"[4/4] Iniciando servidor em {url}  (Ctrl+C para encerrar)\n")

    proc = subprocess.Popen([npm, "run", "dev", "--", "-p", str(porta)], shell=(os.name == "nt"))
    try:
        if aguardar(porta):
            print(f"\nAbrindo o navegador em {url} ...")
            webbrowser.open(url)
        else:
            print("\nO servidor demorou demais. Abra manualmente:", url)
        proc.wait()
    except KeyboardInterrupt:
        print("\nEncerrando servidor...")
    finally:
        if proc.poll() is None:
            if os.name == "nt":
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
            else:
                proc.terminate()


if __name__ == "__main__":
    main()
