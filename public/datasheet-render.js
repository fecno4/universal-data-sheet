/**
 * Universal DataSheet Studio — Renderizador das 3 Páginas A4
 * Renderização dinâmica baseada em dados estruturados com suporte a edição WYSIWYG.
 */

window.DatasheetRender = (function () {
  function el(tag, text, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== null && text !== undefined) element.textContent = text;
    return element;
  }

  function createHeader(doc, pageNr) {
    const headerData = doc.header || {};
    const h = el('header', null, 'ds-page-top-header');
    const isEn = doc.lang === 'en_US';

    const topBar = el('div', null, 'ds-top-bar');
    const brandName = (headerData.brand || 'OEM').toUpperCase();
    const docTitle = headerData.title || (isEn ? `TECHNICAL PART DATASHEET - ${brandName}` : `DATASHEET TÉCNICO DE PEÇA - ${brandName}`);

    topBar.append(
      el('span', docTitle, 'ds-doc-type'),
      el('span', `PN ${headerData.part_number || 'OEM'}`, 'ds-doc-pn')
    );

    const pagePrefix = headerData.page_label_prefix || (isEn ? 'Page' : 'Página');
    const pageOf = headerData.page_label_of || (isEn ? 'of' : 'de');

    const topSub = el('div', null, 'ds-top-sub');
    topSub.append(
      el('span', headerData.subtitle || (isEn ? 'Technical engineering document - does not replace VIN validation' : 'Documento técnico de engenharia - não substitui validação por VIN')),
      el('span', `${pagePrefix} ${pageNr} ${pageOf} 3`)
    );

    h.append(topBar, topSub);
    return h;
  }

  function render(doc, container) {
    if (!container) return;
    container.replaceChildren();

    const isEn = doc.lang === 'en_US';
    const p1 = doc.page1 || {};
    const p2 = doc.page2 || {};
    const p3 = doc.page3 || {};
    const header = doc.header || {};
    const brandUpper = (header.brand || 'OEM').toUpperCase();

    // =========================================================================
    // PÁGINA 1: Identificação, Métricas, Imagem e Aplicação
    // =========================================================================
    const page1El = el('div', null, 'datasheet-page a4-page');
    page1El.append(createHeader(doc, 1));

    const p1Body = el('div', null, 'ds-page-body');

    // Hero titles
    const heroTitles = el('div', null, 'ds-hero-titles');
    const eyebrow = el('span', p1.eyebrow || (isEn ? `${brandUpper} • MECHANICAL & ELECTRICAL SYSTEMS` : `${brandUpper} • COMPONENTES MECÂNICOS E ELETRÔNICOS`), 'ds-eyebrow');
    eyebrow.dataset.editable = 'true';
    const mainTitle = el('h1', p1.title || (isEn ? 'TECHNICAL COMPONENT' : 'COMPONENTE TÉCNICO'), 'ds-title');
    mainTitle.dataset.editable = 'true';
    const partHead = el('h2', p1.part_number_heading || (isEn ? `PRIMARY PART NUMBER: ${header.part_number}` : `PART NUMBER PRINCIPAL: ${header.part_number}`), 'ds-part-heading');
    partHead.dataset.editable = 'true';
    heroTitles.append(eyebrow, mainTitle, partHead);

    if (p1.cross_references && !p1.cross_references.includes('Not located') && !p1.cross_references.includes('Não localizado')) {
      const crossRefsCallout = el('div', null, 'ds-cross-refs-callout');
      crossRefsCallout.dataset.editable = 'true';
      crossRefsCallout.append(
        el('strong', isEn ? '🔄 Cross references & market codes: ' : '🔄 Referências cruzadas & códigos de mercado: '),
        p1.cross_references
      );
      heroTitles.append(crossRefsCallout);
    }

    // Moldura de Imagem / Foto Página 1
    const drawingBox = el('div', null, 'ds-drawing-box');
    const p1Img = p1.image_data_url || p1.image_url;
    if (p1Img) {
      const img = el('img', null, 'ds-part-image');
      img.src = p1Img;
      img.alt = p1.image_name || (isEn ? 'Component photograph' : 'Foto do componente');
      drawingBox.append(img);
    } else {
      drawingBox.append(el('div', isEn ? 'Part photograph or component schematic view' : 'Fotografia da peça ou vista esquemática do componente', 'ds-no-image-placeholder'));
    }
    if (p1.image_name) {
      drawingBox.append(el('span', `📷 ${p1.image_name}`, 'ds-image-label'));
    }

    // Grid de 4 Métricas
    const metricsGrid = el('div', null, 'ds-metrics-grid');
    for (const m of (p1.metrics || [])) {
      const cell = el('div', null, 'ds-metric-cell');
      const lbl = el('span', m.label, 'ds-metric-lbl');
      const val = el('strong', m.value, 'ds-metric-val');
      val.dataset.editable = 'true';
      cell.append(lbl, val);
      metricsGrid.append(cell);
    }

    // Aplicação Principal
    const appSection = el('div', null, 'ds-section-block');
    appSection.append(el('h3', p1.application_title || (isEn ? 'Primary application' : 'Aplicação principal'), 'ds-block-heading'));
    const appP = el('p', p1.application || (isEn ? 'Mandatory verification via chassis/VIN prior to installation.' : 'Validação obrigatória por chassi/VIN antes da instalação.'), 'ds-app-text');
    appP.dataset.editable = 'true';
    appSection.append(appP);

    // Alertas de Cotação (Callouts)
    const calloutsBox = el('div', null, 'ds-callouts-container');
    for (const c of (p1.callouts || [])) {
      if (p1.cross_references && c.includes(p1.cross_references)) {
        continue;
      }
      const box = el('div', null, 'ds-callout-box');
      box.dataset.editable = 'true';
      if (c.includes('**')) {
        box.innerHTML = c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      } else {
        box.textContent = c;
      }
      calloutsBox.append(box);
    }

    p1Body.append(heroTitles, drawingBox, metricsGrid, appSection, calloutsBox);
    page1El.append(p1Body);

    // =========================================================================
    // PÁGINA 2: Especificações Técnicas e Checklist
    // =========================================================================
    const page2El = el('div', null, 'datasheet-page a4-page');
    page2El.append(createHeader(doc, 2));

    const p2Body = el('div', null, 'ds-page-body');
    const secTitle = el('h2', p2.title || (isEn ? 'Technical specifications' : 'Especificações técnicas'), 'ds-section-title');
    secTitle.dataset.editable = 'true';

    // Tabela das 16 Especificações
    const table = el('table', null, 'ds-specs-table');
    const tbody = el('tbody');
    const naFallback = isEn ? 'Not located in specific technical sources for this reference.' : 'Não localizado em fonte técnica específica para esta referência.';
    for (const s of (p2.specs || [])) {
      const tr = el('tr');
      const th = el('th', s.label, 'ds-spec-label');
      const td = el('td', s.value || naFallback, 'ds-spec-value');
      td.dataset.editable = 'true';
      tr.append(th, td);
      tbody.append(tr);
    }
    table.append(tbody);

    // Checklist Visual
    const checkSec = el('div', null, 'ds-checklist-section');
    const checkTitle = el('h3', p2.checklist_title || (isEn ? 'Visual inspection & procurement checklist' : 'Checklist visual e de fornecimento'), 'ds-block-heading');
    checkTitle.dataset.editable = 'true';
    const checkList = el('ul', null, 'ds-checklist-list');
    for (const item of (p2.checklist_items || [])) {
      const li = el('li', null, 'ds-check-item');
      li.append(el('span', '✓', 'ds-check-icon'));
      const textSpan = el('span', item, 'ds-check-text');
      textSpan.dataset.editable = 'true';
      li.append(textSpan);
      checkList.append(li);
    }
    checkSec.append(checkTitle, checkList);

    // Limite de Confirmação
    const limitBox = el('div', null, 'ds-limit-box');
    limitBox.append(el('h4', p2.confirmation_limit_title || (isEn ? 'Confirmation limit' : 'Limite de confirmação'), 'ds-limit-title'));
    const limitP = el('p', p2.confirmation_limit || (isEn ? 'Data gathered through technical engineering compilation.' : 'Dados apurados por compilação técnica de engenharia.'), 'ds-limit-text');
    limitP.dataset.editable = 'true';
    limitBox.append(limitP);

    p2Body.append(secTitle, table, checkSec, limitBox);
    page2El.append(p2Body);

    // =========================================================================
    // PÁGINA 3: Diagrama Ampliado, Fontes e Disclaimer
    // =========================================================================
    const page3El = el('div', null, 'datasheet-page a4-page');
    page3El.append(createHeader(doc, 3));

    const p3Body = el('div', null, 'ds-page-body');
    const p3Titles = el('div', null, 'ds-page3-titles');
    const catTitle = el('h2', p3.title || (isEn ? 'Catalog & validation' : 'Catálogo e validação'), 'ds-section-title');
    catTitle.dataset.editable = 'true';
    const catSub = el('h3', p3.subtitle || (isEn ? `${brandUpper} - Technical validation` : `${brandUpper} - Validação técnica`), 'ds-catalog-sub');
    catSub.dataset.editable = 'true';
    p3Titles.append(catTitle, catSub);

    // Moldura do Diagrama Ampliado Página 3
    const fullDiagBox = el('div', null, 'ds-full-diagram-frame');
    const p3Img = p3.image_data_url || p3.image_url;
    if (p3Img) {
      const diagImg = el('img', null, 'ds-diagram-img');
      diagImg.src = p3Img;
      diagImg.alt = p3.image_name || (isEn ? 'Expanded technical diagram' : 'Diagrama técnico ampliado');
      fullDiagBox.append(diagImg);
    } else {
      fullDiagBox.append(el('div', isEn ? 'Expanded exploded view, sectional drawing, or mounting diagram' : 'Diagrama técnico explodido, vista em corte ou esquema de montagem ampliado', 'ds-no-image-placeholder'));
    }
    if (p3.image_name) {
      fullDiagBox.append(el('span', `📐 ${p3.image_name}`, 'ds-image-label'));
    }

    // Nota de Destaque
    const noteP = el('p', null, 'ds-highlight-note');
    noteP.dataset.editable = 'true';
    const highlightTitle = p3.highlight_title || (isEn ? 'Inspection highlight: ' : 'Destaque de conferência: ');
    const rawNote = p3.highlight_note || '';
    const cleanNote = rawNote.replace(/^(Destaque de conferência:|Inspection highlight:)\s*/i, '').trim() || (isEn ? 'Verify part number and geometry against OEM catalog.' : 'Cotejar o código e geometria com o catálogo oficial.');
    noteP.append(
      el('strong', highlightTitle),
      document.createTextNode(cleanNote)
    );

    // Fontes Consultadas
    const sourcesSec = el('div', null, 'ds-sources-section');
    sourcesSec.append(el('h4', p3.sources_title || (isEn ? 'Consulted sources' : 'Fontes consultadas'), 'ds-sources-title'));
    const ol = el('ol', null, 'ds-sources-list');
    for (const src of (p3.sources || [])) {
      const li = el('li', src);
      li.dataset.editable = 'true';
      ol.append(li);
    }
    sourcesSec.append(ol);

    // Disclaimer
    const discBox = el('div', p3.disclaimer || (isEn ? 'Fitment subject to VIN validation.' : 'Aplicação sujeita a conferência por VIN.'), 'ds-disclaimer-box');
    discBox.dataset.editable = 'true';

    p3Body.append(p3Titles, fullDiagBox, noteP, sourcesSec, discBox);
    page3El.append(p3Body);

    container.append(page1El, page2El, page3El);
  }

  return {
    render
  };
})();
