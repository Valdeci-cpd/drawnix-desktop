# Drawnix Desktop

> Uma versão desktop, offline e nativa do [Drawnix](https://github.com/plait-board/drawnix), construída com [Tauri v2](https://v2.tauri.app/).

Drawnix Desktop empacota o whiteboard open-source Drawnix (mapas mentais, fluxogramas, desenho livre) em um aplicativo nativo para Windows, com salvamento de arquivos direto no disco, funcionamento 100% offline e sem telemetria.

## ✨ O que este fork adiciona sobre o Drawnix original

O Drawnix já é uma ferramenta excelente, mas foi projetado como aplicação web (SaaS). Este projeto adapta a mesma base de código para uma experiência desktop de primeira classe:

- 🖥️ **Aplicativo nativo**, sem depender de navegador ou conexão com a internet
- 💾 **Salvar / Salvar como / Abrir** usando o diálogo de arquivos nativo do sistema operacional, no lugar da File System Access API do navegador
- 🔄 **Memória de arquivo entre sessões** — feche o app, abra de novo, e `Ctrl+S` continua salvando no mesmo arquivo, sem precisar escolher o caminho de novo
- 📡 **Zero telemetria** — a chamada de analytics (Umami) presente na versão web foi removida
- 🖱️ **Tela cheia nativa com F11** — atalho não existente no Drawnix original, implementado via API de janela do Tauri
- 📦 **Binário leve**, usando o WebView nativo do sistema (WebView2 no Windows) em vez de empacotar um Chromium inteiro

Todo o núcleo de desenho, mapas mentais, fluxogramas, conversão markdown→mindmap e mermaid→fluxograma é herdado sem alterações do [Plait](https://github.com/plait-board) e do Drawnix original.

## 📥 Instalação (usuário final)

Baixe o instalador mais recente na seção [Releases](https://github.com/Valdeci-cpd/drawnix-desktop/releases/tag/v1.0.0) (`.exe`) e execute. Não é necessário instalar Node.js, Rust ou qualquer dependência — tudo já vem empacotado no binário.

## 🛠️ Rodando localmente (desenvolvimento)

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (via rustup)
- Windows: [Microsoft Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) e [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) (já vem por padrão no Windows 10/11 atualizado)
- [Tauri CLI](https://v2.tauri.app/reference/cli/): `npm install -D @tauri-apps/cli@latest`

### Setup

```bash
git clone <url-deste-repositorio>
cd drawnix
npm install
```

### Modo desenvolvimento

```bash
npx tauri dev
```

Isso sobe o servidor Vite (`npm run start`, porta 7200) e abre a janela nativa do Tauri apontando para ele, com hot-reload.

### Build de produção

```bash
npx tauri build
```

Gera o instalador em `src-tauri/target/release/bundle/` (`.msi` e/ou `.exe` no Windows).

## ⌨️ Atalhos de teclado

Além de todos os atalhos originais do Drawnix (ferramentas, desfazer/refazer, exportação), este fork adiciona:

| Atalho | Ação |
|---|---|
| `Ctrl+S` | Salvar (no arquivo atual, sem diálogo, após o primeiro save) |
| `Ctrl+Shift+S` | Salvar como (abre diálogo nativo) |
| `F11` | Alternar tela cheia |

## 🏗️ Arquitetura técnica

Este projeto **não reescreve** o Drawnix — ele adiciona uma camada Tauri por cima do build web existente (monorepo Nx/Vite), com pequenas adaptações pontuais:

- `packages/drawnix/src/data/filesystem.ts`: substitui a File System Access API do navegador por `@tauri-apps/plugin-dialog` + `@tauri-apps/plugin-fs` quando executado dentro do Tauri, mantendo compatibilidade total com a versão web original
- `packages/drawnix/src/plugins/with-hotkey.ts`: adiciona o atalho `F11` usando `@tauri-apps/api/window`
- `apps/web/index.html`: remoção do script de analytics (Umami)
- `src-tauri/`: configuração do Tauri (`tauri.conf.json`, `capabilities/`, `Cargo.toml`)

## 📜 Créditos e licença

Este projeto é um fork/wrapper do [Drawnix](https://github.com/plait-board/drawnix), criado pela equipe do [Plait](https://github.com/plait-board), licenciado sob **MIT**. Todo o mérito do motor de desenho, mapas mentais e arquitetura de plugins pertence ao projeto original.

Este fork mantém a licença **MIT** original.

Construído com [Tauri v2](https://v2.tauri.app/) — framework Rust + WebView para aplicações desktop pequenas e seguras.

Veja mais detalhes sobre a motivação deste projeto em [ABOUT.md](./ABOUT.md).
