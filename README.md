# Aeroporto Os Tchutchucos — Estudantes de Engenharia UDF

Projeto **acadêmico e conceitual**. Sem aprovação da ANAC, responsabilidade técnica, topografia ou ensaios.

## Executar no Windows
1. Instale o Node.js LTS (18.18+): https://nodejs.org
2. Extraia o ZIP inteiro.
3. No cmd, na pasta: `python iniciar_aeroporto.py` (ou dois cliques em `iniciar_aeroporto.bat`). Sem Python: `iniciar.bat`.
4. O servidor roda no cmd e o navegador abre sozinho.
Manual: `npm install`, `npm run dev`, `npm test`, `npm run build`.

## Como usar
- **Rolar a página**: a câmera voa pelo aeroporto.
- **Explorar a pé (modo jogo)**: WASD/setas andam, Shift corre, arraste ou Q/R giram a câmera, **E** inspeciona o elemento mais próximo, Esc sai. No celular: joystick na tela.
- **Clicar** em pista, táxi, pátio, terminal, hangar, estacionamento ou rodovia mostra as **medidas** (painel + cotas em 3D).
- **Mapa de voos** (canto): rotas simuladas entre cidades. As partidas e chegadas do hub TCH acompanham os aviões que decolam e pousam na cena. Rotas, horários e números de voo são **fictícios**.
- **Qualidade** (botão no canto esquerdo): baixa, média e alta. O site começa em *média* (ou *baixa* no celular) e baixa sozinho se a taxa de quadros cair. Sombras só na *alta*.
- Pessoas embarcando e desembarcando, carros na BR e parando no estacionamento, veículos de apoio no pátio.

## Outras páginas
Planta técnica (SVG), calculadoras, memorial (CSV/PDF), orçamento editável (preços fictícios), referências.

## Não existe ainda
Galeria real da maquete, formulário de contato, GSAP/Lenis/Recharts, Playwright, GLB com licença, logo vetorial e versões clara/monocromática, dados reais da equipe (`lib/projeto.ts`). Sem `package-lock.json`: o primeiro `npm install` o cria; rode `npm audit`.

## Dados
`lib/dados.ts` (geometria hipotética), `lib/voos.ts` (rotas fictícias), `lib/projeto.ts`, `lib/orcamento-padrao.ts` (preços fictícios).

## Layout da maquete
A disposição do aeródromo segue a foto de referência da maquete: pista à direita com cabeceiras 27/09, rede de táxi em "Y" (Alfa e Bravo) levando ao pátio principal pelo táxi Charlie, pátio norte, dois hangares arqueados, galpão de dentes de serra, oficina, terminal, torre, prédios administrativos, estacionamento, portarias e cerca com portões. Dimensões e designações são **hipotéticas** (ajuste em `lib/dados.ts`). O botão **Visão: maquete/real** alterna entre a base preta com mesa de madeira e o ambiente completo. O modo jogo usa sempre a visão real.


## Publicar no GitHub Pages
1. Crie um repositório chamado **aeroporto-os-tchutchucos** no GitHub.
2. Envie todos os arquivos desta pasta para a branch `main` (incluindo a pasta `.github`).
3. No repositório, abra **Settings → Pages** e selecione **GitHub Actions** em *Build and deployment*.
4. Aguarde a execução da ação **Publicar no GitHub Pages** na aba **Actions**.
5. O site ficará disponível em `https://SEU-USUARIO.github.io/aeroporto-os-tchutchucos/`.

O workflow gera automaticamente a versão estática em `out/`. Para executar localmente, os comandos originais `npm run dev` e `npm run build` continuam disponíveis.
