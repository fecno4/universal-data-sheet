# Walkthrough: Universal DataSheet Studio v2.0

## 1. Visão Geral da Transformação

O **Universal DataSheet Studio v2.0** recebeu uma reformulação ergonômica completa focada em velocidade operacional, clareza visual e independência multimarcas. A interface agora separa os dois fluxos de trabalho principais em modos dedicados, introduz campos de alta visibilidade e disponibiliza uma ListBox interativa para navegação no acervo persistido em PostgreSQL.

---

## 2. Passo a Passo Operacional (Guia do Usuário)

### 2.1. Modo 1: Gerar Novo DataSheet (`⚡ Gerar Novo DataSheet`)

1. **Entrada pelo Hero Input (48px):**
   - O foco inicial do cursor se posiciona automaticamente no campo de Part Number principal.
   - Digite o Part Number da peça (ex.: `21500000`, `3172694`, `2V2899515`).
   - O sistema realiza um lookup automático em tempo real no banco PostgreSQL:
     - Se a peça já estiver no acervo, um badge verde pulsante **`⚡ Já no Acervo!`** aparece. Ao clicar nele, a documentação é carregada imediatamente sem gastar ciclos de GPU.
2. **Seleção de Marca:**
   - Selecione a montadora no seletor (Volvo, Mercedes-Benz, Scania, DAF, MAN, Iveco, VW, etc.).
   - Caso selecione `Outra marca (Digitar)...`, um campo de texto surge automaticamente para digitação livre.
3. **Uploads com Drag & Drop Nativo:**
   - **Foto da Peça (Pág. 1):** Arraste uma foto real da peça, embalagem ou etiqueta e solte na dropzone compacta. A miniatura com nome e tamanho em KB surge imediatamente.
   - **Diagrama Técnico (Pág. 3):** Arraste uma vista explodida ou desenho de catálogo na segunda dropzone.
4. **Enriquecimento Técnico Opcional (Acordeão Retrátil):**
   - Clique em **`📋 Enriquecimento de Engenharia & Pesquisa Externa (Opcional)`** para expandir a gaveta.
   - Cole livremente dados de catálogos online, e-mails de fornecedores ou tabelas de equivalência no campo de pesquisa externa. O parser inteligente extrai deterministamente dimensões, referências cruzadas e códigos OEM.
   - Adicione notas da empresa (ex.: "Exigir foto da etiqueta antes do embarque").
5. **Geração com IA Local:**
   - Selecione o motor de inferência desejado (padrão: `gemma4:12b-it-qat` na RTX 5060 Ti).
   - Clique em **`⚡ Gerar DataSheet Oficial com IA`**.
   - A barra de status exibe o progresso da síntese bilíngue (`pt_BR` e `en_US`).

---

### 2.2. Modo 2: Explorar Acervo de Fichas Salvas (`📚 Explorar Acervo de Fichas Salvas`)

1. **Ativação da Aba do Acervo:**
   - Clique no botão `📚 Explorar Acervo de Fichas Salvas` no topo da aplicação.
   - O catálogo completo de fichas do banco PostgreSQL é carregado automaticamente.
   - O contador de itens é exibido no topo (ex.: `10 DataSheet(s)`).
2. **Filtro em Tempo Real (Client-Side):**
   - No campo de busca, comece a digitar qualquer termo:
     - Digitando `Amortecedor`: filtra instantaneamente todas as fichas com essa palavra no título.
     - Digitando `Volvo` ou `VW`: filtra pela montadora.
     - Digitando `2V28`: filtra pelo prefixo do Part Number.
   - A contagem se ajusta na hora (ex.: `2 de 10 DataSheet(s)`).
   - O botão **`✖ Limpar Filtro`** restaura a lista com 1 clique.
3. **Abertura Instantânea:**
   - Cada card exibe a bandeira da marca, o Part Number em destaque monoespaçado, o título, a data de atualização e os modelos compatíveis.
   - Clique em **`⚡ Abrir Instantâneo`** (ou pressione <kbd>Enter</kbd> / <kbd>Espaço</kbd>):
     - A aplicação alterna automaticamente para o modo de exibição, preenche os dados nos campos e renderiza as 3 páginas A4 imediatamente.

---

### 2.3. Controle do Documento, Edição e Impressão Oficial A4

1. **Alternância Bilíngue em 1 Clique:**
   - Alterne instantaneamente entre as abas `[ 🇧🇷 Português (pt-BR) ]` e `[ 🇺🇸 English (en-US) ]`.
2. **Modo Edição Inline WYSIWYG:**
   - Clique em **`✏️ Ativar Edição`**.
   - Qualquer texto nas 3 páginas A4 se torna editável diretamente no documento.
   - Para reverter para o original gerado pela IA, clique em **`↺ Restaurar IA`**.
3. **Persistência de Alterações:**
   - Clique em **`💾 Salvar no Acervo`** para gravar no PostgreSQL as edições manuais ou novas imagens anexadas.
4. **Impressão Oficial Calibrada para 3 Páginas A4:**
   - Botão **`🖨️ Salvar PDF (pt-BR)`**: Dispara o diálogo de impressão do navegador já com o nome do arquivo sugerido (ex.: `DataSheet_pt_BR_Volvo_21500000.pdf`).
   - Botão **`🖨️ Salvar PDF (en-US)`**: Imprime a versão internacional em inglês.
   - O documento é impresso rigorosamente em 3 folhas A4 sem cortes e sem controles de UI visíveis no PDF.

---

## 3. Validação e Qualidade Técnica

- **Suíte de Testes:** 4 testes unitários automatizados cobrindo HTML, CSS, JavaScript e rotas do servidor.
- **Execução:**
  ```bash
  node --test
  # 4 pass / 0 fail (100% aprovado)
  ```
- **Ambiente de Produção:**
  - Container LXC `113` (`10.88.30.63`) executando Nginx reverso e Node.js v24 via systemd.
  - Acesso público na rede interna: `http://10.88.30.63/`.
