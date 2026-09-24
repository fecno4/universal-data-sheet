# Universal DataSheet Studio (Multimarcas com IA Local)

Aplicação independente para geração de **DataSheets Técnicos Oficiais de 3 Páginas (Padrão A4)** para componentes de veículos comerciais e industriais de **qualquer marca** (Volvo, Mercedes-Benz, Scania, DAF, MAN, Iveco, Volkswagen, Cummins, Caterpillar, Bosch, ZF, Knorr, etc.).

---

## 1. Características Principais

- **Independência Total:** Totalmente desacoplado de catálogos específicos ou bancos de dados locais pesados.
- **Entrada Baseada em Pesquisa do Operador:** O operador cola livremente textos de catálogos online, e-mails de fornecedores, tabelas de medidas ou especificações e a IA local faz a leitura, extração e padronização técnica.
- **Geração Simultânea Bilíngue (`pt_BR` e `en_US`):** Em uma única inferência inteligente, a IA sintetiza o documento em português técnico brasileiro formal e em inglês técnico automotivo internacional para exportação global.
- **Dois PDFs Separados em 1-Clique:** Botões dedicados `🖨️ Salvar PDF (pt-BR)` e `🖨️ Salvar PDF (en-US)` que isolam e imprimem exatamente as 3 páginas A4 da versão escolhida, configurando o nome sugerido do arquivo automaticamente.
- **Abas de Visualização Rápida:** Alternância instantânea entre as versões `[🇧🇷 Português (pt-BR)]` e `[🇺🇸 English (en-US)]`, preservando edições manuais em ambas.
- **Motor de IA Local On-Premise Multi-Servidor:**
  - **Servidor `10.88.30.12` (Porta túnel `127.0.0.1:11434`):** Dedicado ao modelo **`gemma4:26b`** (26B parâmetros) para máxima precisão técnica e redação formal bilíngue.
  - **Servidor `10.88.30.11` (Porta túnel `127.0.0.1:11435`):** Dedicado ao modelo **`granite4:7b-a1b-h`** (MoE com 1B ativo) para síntese ultrarrápida com baixo consumo de memória (~4.3 GB).
  - **Governança Estrita de RAM:** Carregamento estrito de **1 único modelo por vez por servidor** para evitar esgotamento de memória e travamentos de VRAM.
  - **Zero Ollama no Localhost:** O ambiente local do Windows não possui Ollama instalado; as conexões passam pelo túnel SSH automatizado em `run.ps1`.
- **Upload Duplo de Imagens:**
  - **Página 1:** Foto real da peça física, etiqueta ou embalagem (compartilhada em ambas as versões).
  - **Página 3:** Diagrama técnico explodido, esquema de corte ou vista dimensional (compartilhada em ambas as versões).
- **Estrutura Rigorosa de 3 Páginas A4 por Idioma:**
  - **Página 1:** Identificação formal da montadora, título hero, part number, fotografia, métricas e alertas de cotação.
  - **Página 2:** 16 especificações técnicas estruturadas, checklist de fornecimento e limite de confirmação.
  - **Página 3:** Diagrama ampliado, nota de conferência, fontes consultadas e disclaimer regulatório.
- **Modo de Edição Inline WYSIWYG:** Possibilidade de alterar qualquer campo de texto diretamente no documento visual antes da impressão em qualquer idioma.
- **Impressão PDF Calibrada:** Compatível com Safari/WebKit (macOS), Google Chrome, Firefox e Edge, gerando estritamente 3 páginas sem páginas em branco intercaladas.
- **Zero Dependências npm:** Desenvolvido em Node.js nativo puro (sem necessidade de `npm install`).

---

## 2. Como Executar Localmente (Windows)

### Opção 1: Via Script 1-Clique (Recomendado)
No terminal PowerShell:
```powershell
cd c:\Users\work\Nextcloud\VSCode\Universal-DataSheet
.\run.ps1
```
O script iniciará o servidor e abrirá o navegador automaticamente em `http://localhost:8098`.

### Opção 2: Diretamente via Node.js
```powershell
cd c:\Users\work\Nextcloud\VSCode\Universal-DataSheet
node server.mjs
```
Acesse no navegador: **`http://localhost:8098`**

---

## 3. Como Fazer o Deploy no Novo Container LXC (Debian / Ubuntu)

Quando você criar o novo container LXC para hospedar esta aplicação:

1. **Copiar os arquivos do projeto para o container:**
   ```bash
   scp -r Universal-DataSheet/* root@<IP_DO_NOVO_LXC>:/opt/universal-datasheet/
   ```

2. **Garantir Node.js 20+ no container LXC:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
   apt-get install -y nodejs
   ```

3. **Configurar e Ativar o Serviço systemd:**
   ```bash
   cp /opt/universal-datasheet/systemd/universal-datasheet.service /etc/systemd/system/
   systemctl daemon-reload
   systemctl enable --now universal-datasheet.service
   ```

4. **Verificar o Status:**
   ```bash
   systemctl status universal-datasheet.service
   ```

5. **(Opcional) Configurar Nginx Reverso:**
   Encaminhe a porta 80 do LXC para `127.0.0.1:8098` com suporte a timeouts de até 180s para a IA:
   ```nginx
   server {
       listen 80;
       server_name _;

       location / {
           proxy_pass http://127.0.0.1:8098;
           proxy_http_version 1.1;
           proxy_read_timeout 180s;
           proxy_send_timeout 180s;
           client_max_body_size 25M;
       }
   }
   ```

---

## 4. Variáveis de Ambiente Suportadas

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `PORT` | `8098` | Porta TCP na qual o servidor HTTP escutará |
| `OLLAMA_URL` | `http://10.88.30.12:11434` | URL base da API do servidor de IA Ollama |
