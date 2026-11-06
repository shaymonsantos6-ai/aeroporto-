@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Aeroporto Os Tchutchucos

echo [1/4] Verificando Node.js e npm...
where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  echo Instale a versao LTS (18.18 ou superior) em https://nodejs.org e execute este arquivo novamente.
  pause & exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERRO: npm nao encontrado. Reinstale o Node.js LTS em https://nodejs.org
  pause & exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo Node.js %%v encontrado.

echo [2/4] Verificando arquivos do projeto...
if not exist package.json (
  echo ERRO: package.json nao encontrado. Execute o .bat dentro da pasta do projeto.
  pause & exit /b 1
)
if not exist app\page.tsx (
  echo ERRO: pasta "app" incompleta. Extraia o ZIP inteiro antes de executar.
  pause & exit /b 1
)

echo [3/4] Dependencias...
if not exist node_modules (
  if exist package-lock.json (
    echo Instalando com "npm ci" - reproduzivel...
    call npm ci
  ) else (
    echo package-lock.json ausente. Usando "npm install", que vai gerar o arquivo.
    call npm install
  )
  if errorlevel 1 (
    echo ERRO na instalacao. Verifique a conexao com a internet e tente de novo.
    pause & exit /b 1
  )
) else (
  echo node_modules ja existe. Nada a instalar.
)

echo [4/4] Iniciando servidor em http://localhost:3000 (Ctrl+C para parar)
start "" http://localhost:3000
call npm run dev
if errorlevel 1 (
  echo ERRO ao iniciar o servidor de desenvolvimento.
  pause & exit /b 1
)
endlocal
