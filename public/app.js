/**
 * Universal DataSheet Studio — Controlador da Aplicação Web (Suporte Bilíngue & UX v2.0)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos de Navegação / Modos
  const modeGenerateBtn = document.getElementById('mode-generate-btn');
  const modeAcervoBtn = document.getElementById('mode-acervo-btn');
  const modeAcervoCount = document.getElementById('mode-acervo-count');
  const formSection = document.getElementById('form-section');
  const acervoSection = document.getElementById('acervo-section');

  // Elementos do Formulário
  const form = document.getElementById('datasheet-form');
  const brandSelect = document.getElementById('brand-select');
  const brandCustomInput = document.getElementById('brand-custom-input');
  const partNumberInput = document.getElementById('part-number-input');
  const componentTitleInput = document.getElementById('component-title-input');
  const categoryInput = document.getElementById('category-input');
  const catalogRefInput = document.getElementById('catalog-ref-input');
  const quantityInput = document.getElementById('quantity-input');
  const applicationInput = document.getElementById('application-input');
  const externalResearchInput = document.getElementById('external-research-input');
  const companyNotesInput = document.getElementById('company-notes-input');
  const sourcesInput = document.getElementById('sources-input');
  const aiModelSelect = document.getElementById('ai-model-select');
  const generateBtn = document.getElementById('generate-btn');
  const forceGenerateBtn = document.getElementById('force-generate-btn');
  const generationStatus = document.getElementById('generation-status');
  const statusMessage = document.getElementById('status-message');
  const serverStatus = document.getElementById('server-status');
  const pnLookupStatus = document.getElementById('pn-lookup-status');

  // Elementos do Acervo (PostgreSQL)
  const acervoSearchInput = document.getElementById('acervo-search-input');
  const acervoSearchBtn = document.getElementById('acervo-search-btn');
  const acervoClearBtn = document.getElementById('acervo-clear-btn');
  const acervoResultsContainer = document.getElementById('acervo-results-container');
  const acervoListbox = document.getElementById('acervo-listbox');
  const acervoCountBadge = document.getElementById('acervo-count-badge');

  // Elementos do Acordeão de Enriquecimento
  const enrichmentAccordionBtn = document.getElementById('enrichment-accordion-btn');
  const enrichmentAccordionBody = document.getElementById('enrichment-accordion-body');

  // Upload Imagem 1 (Foto Pág. 1)
  const p1Dropzone = document.getElementById('p1-dropzone');
  const p1FileInput = document.getElementById('p1-file-input');
  const p1SelectBtn = document.getElementById('p1-select-btn');
  const p1PreviewBox = document.getElementById('p1-preview-box');
  const p1ThumbImg = document.getElementById('p1-thumb-img');
  const p1FileInfo = document.getElementById('p1-file-info');
  const p1RemoveBtn = document.getElementById('p1-remove-btn');

  // Upload Imagem 2 (Diagrama Pág. 3)
  const p3Dropzone = document.getElementById('p3-dropzone');
  const p3FileInput = document.getElementById('p3-file-input');
  const p3SelectBtn = document.getElementById('p3-select-btn');
  const p3PreviewBox = document.getElementById('p3-preview-box');
  const p3ThumbImg = document.getElementById('p3-thumb-img');
  const p3FileInfo = document.getElementById('p3-file-info');
  const p3RemoveBtn = document.getElementById('p3-remove-btn');

  // Ações do Documento Gerado & Abas Bilíngues
  const docActionsSection = document.getElementById('doc-actions-section');
  const tabPtBtn = document.getElementById('tab-pt-btn');
  const tabEnBtn = document.getElementById('tab-en-btn');
  const docReadyStatus = document.getElementById('doc-ready-status');
  const saveAcervoBtn = document.getElementById('save-acervo-btn');
  const toggleEditBtn = document.getElementById('toggle-edit-btn');
  const restoreOriginalBtn = document.getElementById('restore-original-btn');
  const printPtBtn = document.getElementById('print-pt-btn');
  const printEnBtn = document.getElementById('print-en-btn');

  // Containers de Prévia
  const previewPtContainer = document.getElementById('preview-pt-container');
  const previewEnContainer = document.getElementById('preview-en-container');

  // Estado da Aplicação
  let p1ImageDataUrl = null;
  let p1ImageName = null;
  let p3ImageDataUrl = null;
  let p3ImageName = null;

  let currentBilingualDoc = null;
  let originalBilingualDoc = null;
  let activeLang = 'pt_BR';
  let isEditing = false;
  let allAcervoItems = [];

  // =========================================================================
  // 1. VERIFICAÇÃO DE SAÚDE DO SERVIDOR
  // =========================================================================
  async function checkHealth() {
    try {
      const resp = await fetch('/api/health');
      if (resp.ok) {
        serverStatus.textContent = 'Servidor Online (Porta 8098)';
      } else {
        serverStatus.textContent = 'Servidor com instabilidade';
      }
    } catch {
      serverStatus.textContent = 'Servidor Offline';
    }
  }
  checkHealth();

  // =========================================================================
  // 2. ALTERNADOR SEGMENTADO DE MODOS (GERAR vs ACERVO)
  // =========================================================================
  function switchViewMode(mode) {
    if (mode === 'generate') {
      modeGenerateBtn.classList.add('active');
      modeGenerateBtn.setAttribute('aria-selected', 'true');
      modeAcervoBtn.classList.remove('active');
      modeAcervoBtn.setAttribute('aria-selected', 'false');
      formSection.hidden = false;
      acervoSection.hidden = true;
    } else {
      modeAcervoBtn.classList.add('active');
      modeAcervoBtn.setAttribute('aria-selected', 'true');
      modeGenerateBtn.classList.remove('active');
      modeGenerateBtn.setAttribute('aria-selected', 'false');
      formSection.hidden = true;
      acervoSection.hidden = false;

      // Carrega acervo sob demanda se ainda não carregado
      if (allAcervoItems.length === 0) {
        loadAcervoCatalog();
      }
    }
  }

  if (modeGenerateBtn) modeGenerateBtn.addEventListener('click', () => switchViewMode('generate'));
  if (modeAcervoBtn) modeAcervoBtn.addEventListener('click', () => switchViewMode('acervo'));

  // =========================================================================
  // 3. SELETOR DE MARCA CUSTOMIZADA
  // =========================================================================
  brandSelect.addEventListener('change', () => {
    if (brandSelect.value === '__custom__') {
      brandCustomInput.hidden = false;
      brandCustomInput.focus();
    } else {
      brandCustomInput.hidden = true;
      brandCustomInput.value = '';
    }
  });

  function getSelectedBrand() {
    if (brandSelect.value === '__custom__') {
      return brandCustomInput.value.trim() || 'Multimarcas';
    }
    return brandSelect.value;
  }

  // =========================================================================
  // 4. ACORDEÃO RETRÁTIL DE ENRIQUECIMENTO
  // =========================================================================
  if (enrichmentAccordionBtn && enrichmentAccordionBody) {
    enrichmentAccordionBtn.addEventListener('click', () => {
      const isHidden = enrichmentAccordionBody.hidden;
      enrichmentAccordionBody.hidden = !isHidden;
      enrichmentAccordionBtn.closest('.ds-accordion-wrapper')?.classList.toggle('open', isHidden);
    });
  }

  function openAccordionIfFilled() {
    if (externalResearchInput.value.trim() || companyNotesInput.value.trim() || sourcesInput.value.trim()) {
      if (enrichmentAccordionBody) {
        enrichmentAccordionBody.hidden = false;
        enrichmentAccordionBtn?.closest('.ds-accordion-wrapper')?.classList.add('open');
      }
    }
  }

  // =========================================================================
  // 5. ALTERNAR IDIOMA DE VISUALIZAÇÃO (pt-BR / en-US)
  // =========================================================================
  function switchLanguage(lang) {
    activeLang = lang;
    if (lang === 'pt_BR') {
      tabPtBtn.classList.add('active');
      tabEnBtn.classList.remove('active');
      previewPtContainer.classList.add('active-lang');
      previewEnContainer.classList.remove('active-lang');
      previewPtContainer.hidden = false;
      previewEnContainer.hidden = true;
    } else {
      tabEnBtn.classList.add('active');
      tabPtBtn.classList.remove('active');
      previewEnContainer.classList.add('active-lang');
      previewPtContainer.classList.remove('active-lang');
      previewEnContainer.hidden = false;
      previewPtContainer.hidden = true;
    }

    if (isEditing) {
      const container = activeLang === 'pt_BR' ? previewPtContainer : previewEnContainer;
      container.querySelectorAll('[data-editable]').forEach(el => el.contentEditable = 'true');
    }
  }

  tabPtBtn.addEventListener('click', () => switchLanguage('pt_BR'));
  tabEnBtn.addEventListener('click', () => switchLanguage('en_US'));

  // =========================================================================
  // 6. GERENCIAMENTO DE UPLOAD COM DRAG & DROP NATIVO (HTML5)
  // =========================================================================
  function handleP1File(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      p1ImageDataUrl = evt.target.result;
      p1ImageName = file.name;
      p1ThumbImg.src = p1ImageDataUrl;
      p1FileInfo.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
      p1PreviewBox.hidden = false;
      p1SelectBtn.textContent = '📷 Alterar';

      // Atualiza ambas as versões sincronizadamente
      if (currentBilingualDoc) {
        if (currentBilingualDoc.pt_BR?.page1) {
          currentBilingualDoc.pt_BR.page1.image_data_url = p1ImageDataUrl;
          currentBilingualDoc.pt_BR.page1.image_name = p1ImageName;
          window.DatasheetRender.render(currentBilingualDoc.pt_BR, previewPtContainer);
        }
        if (currentBilingualDoc.en_US?.page1) {
          currentBilingualDoc.en_US.page1.image_data_url = p1ImageDataUrl;
          currentBilingualDoc.en_US.page1.image_name = p1ImageName;
          window.DatasheetRender.render(currentBilingualDoc.en_US, previewEnContainer);
        }
        if (isEditing) {
          document.querySelectorAll('.lang-container [data-editable]').forEach(el => el.contentEditable = 'true');
        }
        attachImageToDoc(p1ImageDataUrl, p1ImageName, 1);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleP3File(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      p3ImageDataUrl = evt.target.result;
      p3ImageName = file.name;
      p3ThumbImg.src = p3ImageDataUrl;
      p3FileInfo.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
      p3PreviewBox.hidden = false;
      p3SelectBtn.textContent = '📐 Alterar';

      if (currentBilingualDoc) {
        if (currentBilingualDoc.pt_BR?.page3) {
          currentBilingualDoc.pt_BR.page3.image_data_url = p3ImageDataUrl;
          currentBilingualDoc.pt_BR.page3.image_name = p3ImageName;
          window.DatasheetRender.render(currentBilingualDoc.pt_BR, previewPtContainer);
        }
        if (currentBilingualDoc.en_US?.page3) {
          currentBilingualDoc.en_US.page3.image_data_url = p3ImageDataUrl;
          currentBilingualDoc.en_US.page3.image_name = p3ImageName;
          window.DatasheetRender.render(currentBilingualDoc.en_US, previewEnContainer);
        }
        if (isEditing) {
          document.querySelectorAll('.lang-container [data-editable]').forEach(el => el.contentEditable = 'true');
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function setupDropzone(dropzoneEl, fileInputEl, onFileSelected) {
    if (!dropzoneEl || !fileInputEl) return;
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzoneEl.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneEl.classList.add('ds-dropzone-dragover');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropzoneEl.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneEl.classList.remove('ds-dropzone-dragover');
      });
    });
    dropzoneEl.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        onFileSelected(file);
      }
    });
    dropzoneEl.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-thumb') || e.target.closest('.upload-btn')) return;
      fileInputEl.click();
    });
  }

  p1SelectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    p1FileInput.click();
  });
  p1FileInput.addEventListener('change', (e) => handleP1File(e.target.files?.[0]));
  setupDropzone(p1Dropzone, p1FileInput, handleP1File);

  p1RemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    p1FileInput.value = '';
    p1ImageDataUrl = null;
    p1ImageName = null;
    p1PreviewBox.hidden = true;
    p1SelectBtn.textContent = '📁 Selecionar';

    if (currentBilingualDoc) {
      if (currentBilingualDoc.pt_BR?.page1) {
        currentBilingualDoc.pt_BR.page1.image_data_url = null;
        currentBilingualDoc.pt_BR.page1.image_name = null;
        window.DatasheetRender.render(currentBilingualDoc.pt_BR, previewPtContainer);
      }
      if (currentBilingualDoc.en_US?.page1) {
        currentBilingualDoc.en_US.page1.image_data_url = null;
        currentBilingualDoc.en_US.page1.image_name = null;
        window.DatasheetRender.render(currentBilingualDoc.en_US, previewEnContainer);
      }
      if (isEditing) {
        document.querySelectorAll('.lang-container [data-editable]').forEach(el => el.contentEditable = 'true');
      }
    }
  });

  p3SelectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    p3FileInput.click();
  });
  p3FileInput.addEventListener('change', (e) => handleP3File(e.target.files?.[0]));
  setupDropzone(p3Dropzone, p3FileInput, handleP3File);

  p3RemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    p3FileInput.value = '';
    p3ImageDataUrl = null;
    p3ImageName = null;
    p3PreviewBox.hidden = true;
    p3SelectBtn.textContent = '📁 Selecionar';

    if (currentBilingualDoc) {
      if (currentBilingualDoc.pt_BR?.page3) {
        currentBilingualDoc.pt_BR.page3.image_data_url = null;
        currentBilingualDoc.pt_BR.page3.image_name = null;
        window.DatasheetRender.render(currentBilingualDoc.pt_BR, previewPtContainer);
      }
      if (currentBilingualDoc.en_US?.page3) {
        currentBilingualDoc.en_US.page3.image_data_url = null;
        currentBilingualDoc.en_US.page3.image_name = null;
        window.DatasheetRender.render(currentBilingualDoc.en_US, previewEnContainer);
      }
      if (isEditing) {
        document.querySelectorAll('.lang-container [data-editable]').forEach(el => el.contentEditable = 'true');
      }
    }
  });

  // =========================================================================
  // 7. ACERVO CENTRALIZADO: LISTBOX INTERATIVA & FILTRO EM TEMPO REAL
  // =========================================================================
  async function loadAcervoCatalog() {
    if (!acervoListbox) return;
    acervoResultsContainer.hidden = false;
    acervoResultsContainer.className = 'acervo-results loading';
    acervoResultsContainer.textContent = 'Carregando acervo de DataSheets do PostgreSQL...';

    try {
      const resp = await fetch('/api/datasheets/search?limit=100');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const res = await resp.json();
      allAcervoItems = res?.items || [];
      acervoResultsContainer.hidden = true;

      updateAcervoBadges(allAcervoItems.length, allAcervoItems.length);
      renderAcervoListbox(allAcervoItems);
    } catch (err) {
      acervoResultsContainer.className = 'acervo-results error';
      acervoResultsContainer.textContent = `Erro ao carregar acervo: ${err.message}`;
    }
  }

  function updateAcervoBadges(visibleCount, totalCount) {
    if (modeAcervoCount) modeAcervoCount.textContent = String(totalCount);
    if (acervoCountBadge) {
      acervoCountBadge.textContent = visibleCount === totalCount
        ? `${totalCount} DataSheet(s)`
        : `${visibleCount} de ${totalCount} DataSheet(s)`;
    }
  }

  function renderAcervoListbox(items, filterTerm = '') {
    if (!acervoListbox) return;
    acervoListbox.innerHTML = '';

    if (items.length === 0) {
      acervoResultsContainer.hidden = false;
      acervoResultsContainer.className = 'acervo-results';
      acervoResultsContainer.textContent = filterTerm
        ? `Nenhum DataSheet corresponde ao filtro "${filterTerm}".`
        : 'Nenhum DataSheet salvo no acervo até o momento.';
      return;
    }

    acervoResultsContainer.hidden = true;

    for (const it of items) {
      const opt = document.createElement('div');
      opt.className = 'ds-acervo-listbox-item';
      opt.setAttribute('role', 'option');
      opt.setAttribute('tabindex', '0');
      opt.setAttribute('aria-label', `${it.brand || 'OEM'} PN ${it.part_number} - ${it.title || ''}`);

      const left = document.createElement('div');
      left.className = 'ds-acervo-item-left';

      const topRow = document.createElement('div');
      topRow.className = 'ds-acervo-item-top';

      const brandBadge = document.createElement('span');
      brandBadge.className = 'acervo-brand-badge';
      brandBadge.textContent = it.brand || 'OEM';

      const pnBadge = document.createElement('strong');
      pnBadge.className = 'acervo-pn-badge';
      pnBadge.textContent = `PN ${it.part_number}`;

      topRow.append(brandBadge, pnBadge);

      if (it.updated_at || it.created_at) {
        const dt = new Date(it.updated_at || it.created_at);
        if (!isNaN(dt.getTime())) {
          const dateSpan = document.createElement('span');
          dateSpan.className = 'ds-acervo-date';
          dateSpan.textContent = `• ${dt.toLocaleDateString('pt-BR')}`;
          topRow.appendChild(dateSpan);
        }
      }

      const titleEl = document.createElement('div');
      titleEl.className = 'ds-acervo-item-title';
      titleEl.textContent = it.title || 'Componente Veicular';

      const metaEl = document.createElement('div');
      metaEl.className = 'ds-acervo-item-meta';
      if (it.model_compat) {
        const mSpan = document.createElement('span');
        mSpan.textContent = `Modelo: ${it.model_compat}`;
        metaEl.appendChild(mSpan);
      }
      if (it.category) {
        const cSpan = document.createElement('span');
        cSpan.textContent = `Sistema: ${it.category}`;
        metaEl.appendChild(cSpan);
      }

      left.append(topRow, titleEl, metaEl);

      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'ds-acervo-open-btn';
      openBtn.textContent = '⚡ Abrir Instantâneo';
      openBtn.onclick = (e) => {
        e.stopPropagation();
        loadSavedDatasheet(it);
      };

      opt.append(left, openBtn);

      opt.addEventListener('click', () => loadSavedDatasheet(it));
      opt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadSavedDatasheet(it);
        }
      });

      acervoListbox.appendChild(opt);
    }
  }

  function applyAcervoFilter(queryStr) {
    const term = (queryStr || '').trim().toLowerCase();
    acervoClearBtn.hidden = !term;

    if (!term) {
      updateAcervoBadges(allAcervoItems.length, allAcervoItems.length);
      renderAcervoListbox(allAcervoItems);
      return;
    }

    const filtered = allAcervoItems.filter(it => {
      const pn = (it.part_number || '').toLowerCase();
      const br = (it.brand || '').toLowerCase();
      const ti = (it.title || '').toLowerCase();
      const mc = (it.model_compat || '').toLowerCase();
      const ca = (it.category || '').toLowerCase();
      return pn.includes(term) || br.includes(term) || ti.includes(term) || mc.includes(term) || ca.includes(term);
    });

    updateAcervoBadges(filtered.length, allAcervoItems.length);
    renderAcervoListbox(filtered, term);
  }

  acervoSearchInput.addEventListener('input', () => {
    applyAcervoFilter(acervoSearchInput.value);
  });

  acervoClearBtn.addEventListener('click', () => {
    acervoSearchInput.value = '';
    applyAcervoFilter('');
    acervoSearchInput.focus();
  });

  acervoSearchBtn.addEventListener('click', () => {
    loadAcervoCatalog();
  });

  // =========================================================================
  // 8. CARREGAR DATASHEET SALVO DO ACERVO
  // =========================================================================
  async function loadSavedDatasheet(item) {
    try {
      acervoResultsContainer.className = 'acervo-results loading';
      acervoResultsContainer.textContent = `Carregando DataSheet ${item.brand || 'OEM'} PN ${item.part_number} do banco de dados...`;
      acervoResultsContainer.hidden = false;

      const resp = await fetch(`/api/datasheets/${item.id}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (!data || !data.content_pt) throw new Error('Dados do DataSheet não retornados pelo servidor');

      currentBilingualDoc = {
        pt_BR: data.content_pt,
        en_US: data.content_en || data.content_pt
      };
      originalBilingualDoc = JSON.parse(JSON.stringify(currentBilingualDoc));

      // Preenche os campos do formulário para referência
      if (item.brand) {
        const matchingOpt = Array.from(brandSelect.options).find(o => o.value.toLowerCase() === item.brand.toLowerCase());
        if (matchingOpt) {
          brandSelect.value = matchingOpt.value;
          brandCustomInput.hidden = true;
        } else {
          brandSelect.value = '__custom__';
          brandCustomInput.hidden = false;
          brandCustomInput.value = item.brand;
        }
      }
      partNumberInput.value = data.part_number || '';
      if (data.title) componentTitleInput.value = data.title;
      if (data.category) categoryInput.value = data.category;
      if (data.model_compat) applicationInput.value = data.model_compat;
      if (data.custom_notes) companyNotesInput.value = data.custom_notes;

      openAccordionIfFilled();

      // Renderiza as páginas
      window.DatasheetRender.render(currentBilingualDoc.pt_BR, previewPtContainer);
      window.DatasheetRender.render(currentBilingualDoc.en_US, previewEnContainer);

      docActionsSection.hidden = false;
      switchLanguage('pt_BR');

      docReadyStatus.textContent = `⚡ Recuperado do Acervo (${item.brand || 'OEM'} PN ${item.part_number})`;
      forceGenerateBtn.hidden = false;
      acervoResultsContainer.hidden = true;

      // Volta para o modo de geração/exibição
      switchViewMode('generate');

      // Scroll suave até a prévia
      previewPtContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      acervoResultsContainer.className = 'acervo-results error';
      acervoResultsContainer.textContent = `Erro ao carregar DataSheet: ${err.message}`;
    }
  }

  // =========================================================================
  // 9. VALIDAÇÃO DINÂMICA DE PART NUMBER NO ACERVO
  // =========================================================================
  let pnLookupTimer = null;
  async function checkPnInAcervo() {
    const pn = partNumberInput.value.trim();
    const brand = getSelectedBrand();
    if (!pn || pn.length < 3) {
      pnLookupStatus.hidden = true;
      return;
    }
    try {
      const resp = await fetch(`/api/datasheets/lookup?part_number=${encodeURIComponent(pn)}&brand=${encodeURIComponent(brand)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.found && data.datasheet) {
          pnLookupStatus.hidden = false;
          pnLookupStatus.textContent = '⚡ Já no Acervo!';
          pnLookupStatus.title = 'Clique para carregar instantaneamente do banco de dados';
          pnLookupStatus.style.cursor = 'pointer';
          pnLookupStatus.onclick = () => loadSavedDatasheet(data.datasheet);
          return;
        }
      }
    } catch {}
    pnLookupStatus.hidden = true;
  }

  partNumberInput.addEventListener('input', () => {
    clearTimeout(pnLookupTimer);
    pnLookupTimer = setTimeout(checkPnInAcervo, 400);
  });
  brandSelect.addEventListener('change', () => {
    clearTimeout(pnLookupTimer);
    pnLookupTimer = setTimeout(checkPnInAcervo, 400);
  });

  // Carrega catálogo inicial em segundo plano
  loadAcervoCatalog();

  // =========================================================================
  // 10. ENVIO DO FORMULÁRIO E GERAÇÃO DOS DATASHEETS BILÍNGUES
  // =========================================================================
  async function submitDatasheetForm(forceRegen = false) {
    const brand = getSelectedBrand();
    const partNumber = partNumberInput.value.trim();

    if (!partNumber) {
      alert('Por favor, informe o Part Number principal.');
      partNumberInput.focus();
      return;
    }

    const sources = sourcesInput.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      brand: brand,
      part_number: partNumber,
      title: componentTitleInput.value.trim(),
      category: categoryInput.value.trim(),
      catalog_ref: catalogRefInput.value.trim(),
      quantity: quantityInput.value.trim() || '1',
      application: applicationInput.value.trim(),
      external_research: externalResearchInput.value.trim(),
      company_notes: companyNotesInput.value.trim(),
      sources: sources,
      model: aiModelSelect.value,
      force_regenerate: forceRegen,
      image_p1_data_url: p1ImageDataUrl,
      image_p1_name: p1ImageName,
      image_p3_data_url: p3ImageDataUrl,
      image_p3_name: p3ImageName
    };

    // Bloqueio de interface e exibição de progresso
    generateBtn.disabled = true;
    forceGenerateBtn.disabled = true;
    generationStatus.hidden = false;
    statusMessage.textContent = forceRegen
      ? `A IA local (${payload.model}) está regenerando a documentação para ${brand} ${partNumber}...`
      : `Consultando acervo ou sintetizando documentação com a IA local (${payload.model}) para ${brand} ${partNumber}...`;

    try {
      const resp = await fetch('/api/datasheets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${resp.status}`);
      }

      const bilingualDoc = await resp.json();
      currentBilingualDoc = bilingualDoc;
      originalBilingualDoc = JSON.parse(JSON.stringify(bilingualDoc));

      // Renderiza as duas versões de forma independente
      window.DatasheetRender.render(currentBilingualDoc.pt_BR, previewPtContainer);
      window.DatasheetRender.render(currentBilingualDoc.en_US, previewEnContainer);

      // Exibe controles do documento e define pt-BR como aba ativa padrão
      docActionsSection.hidden = false;
      switchLanguage('pt_BR');

      if (bilingualDoc.cached) {
        docReadyStatus.textContent = `⚡ Recuperado do Acervo (${brand})`;
        forceGenerateBtn.hidden = false;
      } else {
        docReadyStatus.textContent = `✔ 2 versões salvas no Acervo`;
        forceGenerateBtn.hidden = false;
      }

      // Atualiza catálogo do acervo em segundo plano
      loadAcervoCatalog();

      // Scroll suave até a prévia
      previewPtContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert(`Falha na geração do DataSheet: ${err.message}`);
    } finally {
      generateBtn.disabled = false;
      forceGenerateBtn.disabled = false;
      generationStatus.hidden = true;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitDatasheetForm(false);
  });

  forceGenerateBtn.addEventListener('click', () => {
    submitDatasheetForm(true);
  });

  // =========================================================================
  // 11. ALTERNAR MODO DE EDIÇÃO INLINE WYSIWYG
  // =========================================================================
  toggleEditBtn.addEventListener('click', () => {
    isEditing = !isEditing;
    toggleEditBtn.textContent = isEditing ? '💾 Desativar Edição' : '✏️ Ativar Edição';
    toggleEditBtn.classList.toggle('active', isEditing);

    const allEditable = document.querySelectorAll('.lang-container [data-editable]');
    allEditable.forEach(el => {
      el.contentEditable = isEditing ? 'true' : 'false';
    });
  });

  // =========================================================================
  // 12. RESTAURAR IA ORIGINAL
  // =========================================================================
  restoreOriginalBtn.addEventListener('click', () => {
    if (!originalBilingualDoc) return;
    if (confirm('Deseja descartar as edições manuais e restaurar as versões originais (pt-BR e en-US) geradas pela IA?')) {
      currentBilingualDoc = JSON.parse(JSON.stringify(originalBilingualDoc));
      window.DatasheetRender.render(currentBilingualDoc.pt_BR, previewPtContainer);
      window.DatasheetRender.render(currentBilingualDoc.en_US, previewEnContainer);
      if (isEditing) {
        document.querySelectorAll('.lang-container [data-editable]').forEach(el => el.contentEditable = 'true');
      }
    }
  });

  // =========================================================================
  // 13. PERSISTÊNCIA DE IMAGENS E SALVAMENTO MANUAL NO ACERVO
  // =========================================================================
  async function attachImageToDoc(imageDataUrl, imageName, pageNumber = 1) {
    if (!imageDataUrl || !currentBilingualDoc) return;
    const brand = getSelectedBrand();
    const partNumber = partNumberInput.value.trim() || currentBilingualDoc.pt_BR?.page1?.primary_pn;
    if (!partNumber) return;

    try {
      const resp = await fetch('/api/datasheets/attach-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          part_number: String(partNumber),
          image_data: imageDataUrl,
          image_name: imageName
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.image_url) {
          if (pageNumber === 1) {
            if (currentBilingualDoc.pt_BR?.page1) {
              currentBilingualDoc.pt_BR.page1.image_url = data.image_url;
              delete currentBilingualDoc.pt_BR.page1.image_data_url;
            }
            if (currentBilingualDoc.en_US?.page1) {
              currentBilingualDoc.en_US.page1.image_url = data.image_url;
              delete currentBilingualDoc.en_US.page1.image_data_url;
            }
          }
          console.log(`[Acervo Image] Imagem persistida com sucesso: ${data.image_url} (SHA-256: ${data.sha256})`);
        }
      }
    } catch (e) {
      console.warn('Erro ao persistir imagem imediatamente no acervo:', e);
    }
  }

  async function saveCurrentDocToAcervo() {
    if (!currentBilingualDoc) return;
    const brand = getSelectedBrand();
    const partNumber = partNumberInput.value.trim() || currentBilingualDoc.pt_BR?.page1?.primary_pn || 'OEM';
    const title = currentBilingualDoc.pt_BR?.page1?.title || componentTitleInput.value.trim() || 'Componente';
    const titleEn = currentBilingualDoc.en_US?.page1?.title || title;
    const category = currentBilingualDoc.pt_BR?.page1?.eyebrow || categoryInput.value.trim() || null;
    const application = currentBilingualDoc.pt_BR?.page1?.application || applicationInput.value.trim() || null;
    const modelCompat = applicationInput.value.trim() || null;
    const customNotes = companyNotesInput.value.trim() || null;
    const sources = sourcesInput.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (saveAcervoBtn) {
      saveAcervoBtn.disabled = true;
      saveAcervoBtn.textContent = '💾 Gravando...';
    }

    const payload = {
      brand,
      part_number: String(partNumber),
      title,
      title_en: titleEn,
      model_compat: modelCompat,
      category,
      application,
      custom_notes: customNotes,
      ai_model: aiModelSelect.value,
      sources,
      content_pt: currentBilingualDoc.pt_BR,
      content_en: currentBilingualDoc.en_US,
      image_data: p1ImageDataUrl,
      image_name: p1ImageName,
      diagram_data: p3ImageDataUrl,
      diagram_name: p3ImageName
    };

    try {
      const resp = await fetch('/api/datasheets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.detail || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      docReadyStatus.textContent = `✔ Salvo no Acervo (${brand} PN ${partNumber})`;
      if (saveAcervoBtn) saveAcervoBtn.textContent = '✔ Salvo!';
      if (data.image_url) {
        if (currentBilingualDoc.pt_BR?.page1) {
          currentBilingualDoc.pt_BR.page1.image_url = data.image_url;
          delete currentBilingualDoc.pt_BR.page1.image_data_url;
        }
        if (currentBilingualDoc.en_US?.page1) {
          currentBilingualDoc.en_US.page1.image_url = data.image_url;
          delete currentBilingualDoc.en_US.page1.image_data_url;
        }
      }
      // Atualiza catálogo local
      loadAcervoCatalog();

      setTimeout(() => {
        if (saveAcervoBtn) {
          saveAcervoBtn.disabled = false;
          saveAcervoBtn.textContent = '💾 Salvar no Acervo';
        }
      }, 2500);
    } catch (err) {
      alert(`Erro ao salvar no acervo: ${err.message}`);
      if (saveAcervoBtn) {
        saveAcervoBtn.disabled = false;
        saveAcervoBtn.textContent = '💾 Salvar no Acervo';
      }
    }
  }

  if (saveAcervoBtn) {
    saveAcervoBtn.addEventListener('click', saveCurrentDocToAcervo);
  }

  // =========================================================================
  // 14. IMPRESSÃO / SALVAR PDF OFICIAL ISOLADO
  // =========================================================================
  function printVersion(lang) {
    if (!currentBilingualDoc) return;

    // Garante que o idioma correto esteja ativo e visível
    switchLanguage(lang);

    const brandSafe = getSelectedBrand().replace(/[^a-zA-Z0-9_-]/g, '_');
    const pnSafe = (partNumberInput.value.trim() || 'OEM').replace(/[^a-zA-Z0-9_-]/g, '_');
    const originalTitle = document.title;

    // Sugere nome de arquivo oficial para exportação PDF
    document.title = `DataSheet_${lang}_${brandSafe}_${pnSafe}`;

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 120);
  }

  printPtBtn.addEventListener('click', () => printVersion('pt_BR'));
  printEnBtn.addEventListener('click', () => printVersion('en_US'));
});
