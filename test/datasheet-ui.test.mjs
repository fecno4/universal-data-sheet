import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Universal DataSheet Studio v2.0: index.html possui todos os elementos da nova arquitetura de UI', () => {
  const htmlPath = path.join(projectRoot, 'public', 'index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html deve existir');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1. Alternador de modos segmentado
  assert.match(html, /id="mode-generate-btn"/, 'Deve conter o botão de modo Gerar');
  assert.match(html, /id="mode-acervo-btn"/, 'Deve conter o botão de modo Acervo');
  assert.match(html, /id="mode-acervo-count"/, 'Deve conter contador dinâmico do acervo no botão');
  assert.match(html, /class="ds-mode-switcher"/, 'Deve conter o container ds-mode-switcher');

  // 2. Seções estruturais
  assert.match(html, /id="form-section"/, 'Deve conter a seção de formulário');
  assert.match(html, /id="acervo-section"/, 'Deve conter a seção do acervo');

  // 3. Hero PN Input
  assert.match(html, /class="[^"]*ds-hero-pn-input[^"]*"/, 'Deve conter input com classe ds-hero-pn-input');
  assert.match(html, /id="part-number-input"/, 'Deve conter o input de part number');
  assert.match(html, /id="pn-lookup-status"/, 'Deve conter o badge de lookup do PN');

  // 4. Dropzones compactas
  assert.match(html, /id="p1-dropzone"/, 'Deve conter dropzone da foto (P1)');
  assert.match(html, /id="p3-dropzone"/, 'Deve conter dropzone do diagrama (P3)');
  assert.match(html, /class="[^"]*ds-compact-dropzone-card[^"]*"/, 'Deve conter cards de dropzone compactos');

  // 5. Acordeão de enriquecimento
  assert.match(html, /id="enrichment-accordion-btn"/, 'Deve conter botão do acordeão');
  assert.match(html, /id="enrichment-accordion-body"/, 'Deve conter o corpo do acordeão');
  assert.match(html, /id="external-research-input"/, 'Deve conter o textarea de pesquisa externa');
  assert.match(html, /id="company-notes-input"/, 'Deve conter o textarea de notas da empresa');
  assert.match(html, /id="sources-input"/, 'Deve conter o textarea de fontes');

  // 6. ListBox interativa do Acervo
  assert.match(html, /id="acervo-listbox"/, 'Deve conter container do ListBox');
  assert.match(html, /role="listbox"/, 'Deve possuir semântica role="listbox"');
  assert.match(html, /id="acervo-count-badge"/, 'Deve conter badge de contagem de itens do acervo');
  assert.match(html, /id="acervo-search-input"/, 'Deve conter input de pesquisa/filtro do acervo');
  assert.match(html, /id="acervo-clear-btn"/, 'Deve conter botão de limpar filtro');

  // 7. Ações de Documento e Impressão
  assert.match(html, /id="doc-actions-section"/, 'Deve conter a barra de ações do documento');
  assert.match(html, /id="tab-pt-btn"/, 'Deve conter alternador de idioma pt-BR');
  assert.match(html, /id="tab-en-btn"/, 'Deve conter alternador de idioma en-US');
  assert.match(html, /id="print-pt-btn"/, 'Deve conter botão de impressão pt-BR');
  assert.match(html, /id="print-en-btn"/, 'Deve conter botão de impressão en-US');
  assert.match(html, /id="preview-pt-container"/, 'Deve conter preview pt-BR');
  assert.match(html, /id="preview-en-container"/, 'Deve conter preview en-US');
});

test('Universal DataSheet Studio v2.0: style.css contém classes e regras de UX modernas', () => {
  const cssPath = path.join(projectRoot, 'public', 'style.css');
  assert.ok(fs.existsSync(cssPath), 'style.css deve existir');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Classes essenciais
  assert.match(css, /\.ds-hero-header/, 'Deve conter regras para ds-hero-header');
  assert.match(css, /\.ds-mode-switcher/, 'Deve conter regras para ds-mode-switcher');
  assert.match(css, /\.ds-mode-btn/, 'Deve conter regras para ds-mode-btn');
  assert.match(css, /\.ds-hero-pn-input/, 'Deve conter regras para ds-hero-pn-input');
  assert.match(css, /\.ds-compact-dropzone-card/, 'Deve conter regras para dropzones compactas');
  assert.match(css, /\.ds-accordion-wrapper/, 'Deve conter regras para acordeão retrátil');
  assert.match(css, /\.ds-acervo-listbox/, 'Deve conter regras para ListBox do acervo');
  assert.match(css, /\.ds-acervo-listbox-item/, 'Deve conter regras para itens da ListBox');
});

test('Universal DataSheet Studio v2.0: app.js implementa controle de modos, ListBox e live filter', () => {
  const jsPath = path.join(projectRoot, 'public', 'app.js');
  assert.ok(fs.existsSync(jsPath), 'app.js deve existir');
  const js = fs.readFileSync(jsPath, 'utf8');

  assert.match(js, /switchViewMode/, 'Deve implementar switchViewMode');
  assert.match(js, /loadAcervoCatalog/, 'Deve implementar loadAcervoCatalog');
  assert.match(js, /renderAcervoListbox/, 'Deve implementar renderAcervoListbox');
  assert.match(js, /applyAcervoFilter/, 'Deve implementar applyAcervoFilter');
  assert.match(js, /setupDropzone/, 'Deve implementar setupDropzone');
  assert.match(js, /checkPnInAcervo/, 'Deve implementar checkPnInAcervo');
});

test('Universal DataSheet Studio v2.0: server.mjs protege rotas e entrega assets estáticos', () => {
  const serverPath = path.join(projectRoot, 'server.mjs');
  assert.ok(fs.existsSync(serverPath), 'server.mjs deve existir');
  const serverCode = fs.readFileSync(serverPath, 'utf8');

  // Rotas de API essenciais
  assert.match(serverCode, /\/api\/health/, 'Deve conter rota /api/health');
  assert.match(serverCode, /\/api\/datasheets\/lookup/, 'Deve conter rota /api/datasheets/lookup');
  assert.match(serverCode, /\/api\/datasheets\/search/, 'Deve conter rota /api/datasheets/search');
  assert.match(serverCode, /\/api\/datasheets\/save/, 'Deve conter rota /api/datasheets/save');
  assert.match(serverCode, /\/api\/datasheets\/attach-image/, 'Deve conter rota /api/datasheets/attach-image');
  assert.match(serverCode, /\/api\/datasheets\/generate/, 'Deve conter rota /api/datasheets/generate');
});

test('Universal DataSheet Studio v2.0: isolamento estrito de acervo Scania e escopo universal', () => {
  const htmlPath = path.join(projectRoot, 'public', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(!html.includes('<option value="Scania">Scania</option>'), 'index.html não deve listar Scania no seletor multimarcas');
  assert.match(html, /id="brand-scania-warning"/, 'Deve exibir aviso orientando catálogo Scania dedicado');

  const serverPath = path.join(projectRoot, 'server.mjs');
  const serverCode = fs.readFileSync(serverPath, 'utf8');
  assert.match(serverCode, /X-Datasheet-Scope/, 'Deve incluir header X-Datasheet-Scope');
  assert.match(serverCode, /scope=universal/, 'Deve solicitar scope=universal no backend');
  assert.match(serverCode, /scania/i, 'Deve conter verificação e rejeição para marca Scania');

  const jsPath = path.join(projectRoot, 'public', 'app.js');
  const js = fs.readFileSync(jsPath, 'utf8');
  assert.match(js, /checkBrandScaniaWarning/, 'Deve implementar verificação visual de marca Scania');
  assert.match(js, /scope:\s*['"]universal['"]/, 'Deve persistir com scope universal');
});

test('Universal DataSheet Studio v2.0: proxy e sanitização de imagens de datasheets', () => {
  const serverPath = path.join(projectRoot, 'server.mjs');
  const serverCode = fs.readFileSync(serverPath, 'utf8');
  assert.match(serverCode, /datasheets\/images/, 'server.mjs deve suportar rota proxy para imagens');

  const jsPath = path.join(projectRoot, 'public', 'app.js');
  const js = fs.readFileSync(jsPath, 'utf8');
  assert.match(js, /sanitizeDocImageUrls/, 'app.js deve sanitizar URLs de imagens recuperadas do acervo');
});

