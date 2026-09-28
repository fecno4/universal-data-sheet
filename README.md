# Universal DataSheet Studio (Multimarcas com IA Local)

Aplicação independente para geração de **DataSheets Técnicos Oficiais de 3 Páginas (Padrão A4)** para componentes de veículos comerciais e industriais de **qualquer marca** (Volvo, Mercedes-Benz, Scania, DAF, MAN, Iveco, Volkswagen, Cummins, Caterpillar, Bosch, ZF, Knorr, etc.).

---

## 1. Características Principais

- **Independência Total:** Totalmente desacoplado de catálogos específicos ou bancos de dados locais pesados.
- **Entrada Baseada em Pesquisa do Operador:** O operador cola livremente textos de catálogos online, e-mails de fornecedores, tabelas de medidas ou especificações e a IA local faz a leitura, extração e padronização técnica.
- **Geração Simultânea Bilíngue (`pt_BR` e `en_US`):** Em uma única inferência inteligente, a IA sintetiza o documento em português técnico brasileiro formal e em inglês técnico automotivo internacional para exportação global.
- **Dois PDFs Separados em 1-Clique:** Botões dedicados `🖨️ Salvar PDF (pt-BR)` e `🖨️ Salvar PDF (en-US)` que isolam e imprimem exatamente as 3 páginas A4 da versão escolhida, configurando o nome sugerido do arquivo automaticamente.
- **Abas de Visualização Rápida:** Alternância instantânea entre as versões `[🇧🇷 Português (pt-BR)]` e `[🇺🇸 English (en-US)]`, preservando edições manuais em ambas.
- **Motor de IA Local On-Premise Multi-Servidor (Aceleração por GPU):**
  - **Servidor `10.88.30.12` (GPU NVIDIA RTX 5060 Ti 16GB · Porta túnel `127.0.0.1:11434`):**
    - **`gpt-oss:20b` (Padrão Recomendado · ~13.8 GB):** Reside 100% na VRAM da GPU. Inferência ultrarrápida com alta capacidade analítica para redação técnica formal bilíngue e especificações de engenharia.
    - **`gemma4:12b-it-qat` (~7.15 GB):** Reside 100% na VRAM da GPU com capacidade de visão multimodal para inspeção de desenhos técnicos e fotografias.
    - **`gemma4:26b` / `gemma4:26b-a4b-it-q8_0`:** Modelos de 26B parâmetros disponíveis para auditorias de alta fidelidade técnica.
  - **Servidor `10.88.30.11` (Porta túnel `127.0.0.1:11435`):** Dedicado ao modelo **`granite4:7b-a1b-h`** (MoE com 1B ativo) para síntese ultrarrápida com baixo consumo de memória (~4.3 GB).
  - **Governança Estrita de VRAM/RAM:** Carregamento estrito de **1 único modelo por vez por servidor** gerenciado ativamente via API `/api/ps` e `keep_alive: 0` para prevenir saturação dos 16 GB de VRAM da GPU.
  - **Zero Ollama no Localhost:** O ambiente local do Windows não possui Ollama instalado; as conexões passam pelo túnel SSH automatizado em `run.ps1`.
- **Upload Duplo de Imagens:**
  - **Página 1:** Foto real da peça física, etiqueta ou embalagem (compartilhada em ambas as versões).
  - **Página 3:** Diagrama técnico explodido, esquema de corte ou vista dimensional (compartilhada em ambas as versões).
- **Estrutura Rigorosa de 3 Páginas A4 por Idioma:**
  - **Página 1:** Identificação formal da montadora, título hero, part number, fotografia, métricas e alertas de cotação.
  - **Página 2:** 16 especificações técnicas estruturadas, checklist de fornecimento e limite de confirmação.
  - **Página 3:** Diagrama ampliado, nota de conferência, fontes consultadas e disclaimer regulatório.
- **Arquitetura UX/UI v2.0 (Design Moderno & Produtividade):**
  - **Alternador Segmentado de Modos:** Abas em pílulas (`⚡ Gerar Novo DataSheet` e `📚 Explorar Acervo de Fichas Salvas`) para foco operacional imediato.
  - **Hero Input de Part Number (48px):** Campo de alto impacto visual com busca instantânea no acervo e badge dinâmico interativo (`⚡ Já no Acervo!`).
  - **Dropzones Compactas (~68px) com Drag & Drop Nativo:** Arraste e solte fotografias e diagramas técnicos diretamente na interface.
  - **Acordeão Retrátil de Enriquecimento:** Campos de pesquisa externa, observações corporativas e fontes recolhidos por padrão para máxima ergonomia.
  - **ListBox Interativa do Acervo & Filtro em Tempo Real:** Semântica WAI-ARIA (`role="listbox"`, `role="option"`) com filtro client-side instantâneo a cada tecla digitada sem recarregar a tela.
- **Suíte de Testes Automatizada:** Cobertura de testes unitários para a interface, integridade de rotas e entrega de assets estáticos via `node --test` (4/4 testes aprovados).
- **Modo de Edição Inline WYSIWYG:** Possibilidade de alterar qualquer campo de texto diretamente no documento visual antes da impressão em qualquer idioma.
- **Impressão PDF Calibrada:** Compatível com Safari/WebKit (macOS), Google Chrome, Firefox e Edge, gerando estritamente 3 páginas sem páginas em branco intercaladas.
- **Zero Dependências npm:** Desenvolvido em Node.js nativo puro (sem necessidade de `npm install`).

---

## 2. Como Executar Localmente

### Opção 1: Via Script 1-Clique (Windows)
```powershell
.\run.ps1
```
O script iniciará o servidor e abrirá o navegador automaticamente em `http://localhost:8098`.

### Opção 2: Diretamente via Node.js
```bash
node server.mjs
```
Acesse no navegador: **`http://localhost:8098`**

### Opção 3: Executar a Suíte de Testes
```bash
node --test
# 4 pass / 0 fail (100% de sucesso)
```

---

## 3. Deploy no Container LXC de Produção (`srv-datasheet` - `10.88.30.63`)

A aplicação está hospedada e em produção no container LXC Debian 13 (Trixie) no Proxmox VE:
- **IP do Container:** `10.88.30.63`
- **Porta HTTP Direta:** `http://10.88.30.63:8098/`
- **Porta Nginx Reverso:** `http://10.88.30.63/`
- **Serviço systemd:** `universal-datasheet.service` (`active/running`)

### Deploy Automatizado em 1-Clique:
Para sincronizar alterações locais e reiniciar o serviço no LXC automaticamente:
```bash
bash scripts/deploy.sh
```

### Configurações Realizadas no Servidor:
1. **Node.js 24.21.0:** Instalado via repositório oficial NodeSource.
2. **Serviço systemd:** `/etc/systemd/system/universal-datasheet.service` habilitado e gerenciado por systemctl.
3. **Nginx Reverso com Suporte a IA:** Proxy reverso escutando na porta 80 encaminhando para `127.0.0.1:8098` com timeouts de 300s para geração de fichas por IA e limite de upload de 50MB.

---

## 4. Variáveis de Ambiente Suportadas

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `PORT` | `8098` | Porta TCP na qual o servidor HTTP escutará |
| `OLLAMA_URL` | `http://10.88.30.12:11434` | URL base da API do servidor de IA Ollama |
