/**
 * Universal DataSheet Studio — Controlador da Aplicação Web (Suporte Bilíngue)
 */

document.addEventListener('DOMContentLoaded', () => {
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
  const acervoSearchInput = document.getElementById('acervo-search-input');
  const acervoSearchBtn = document.getElementById('acervo-search-btn');
  const acervoClearBtn = document.getElementById('acervo-clear-btn');
  const acervoResultsContainer = document.getElementById('acervo-results-container');
  const pnLookupStatus = document.getElementById('pn-lookup-status');

  // Upload Imagem 1 (Pág. 1)
  const p1FileInput = document.getElementById('p1-file-input');
  const p1SelectBtn = document.getElementById('p1-select-btn');
  const p1PreviewBox = document.getElementById('p1-preview-box');
  const p1ThumbImg = document.getElementById('p1-thumb-img');
  const p1FileInfo = document.getElementById('p1-file-info');
  const p1RemoveBtn = document.getElementById('p1-remove-btn');

  // Upload Imagem 2 (Pág. 3)
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

  // 1. Verificação de Conexão com o Servidor
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

  // 2. Seletor de Marca Customizada
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

  // 3. Alternar Idioma de Visualização (pt-BR / en-US)
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

  // 4. Gerenciamento de Upload de Imagem 1 (Foto Pág. 1)
  p1SelectBtn.addEventListener('click', () => p1FileInput.click());

  p1FileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      p1ImageDataUrl = evt.target.result;
      p1ImageName = file.name;
      p1ThumbImg.src = p1ImageDataUrl;
      p1FileInfo.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
      p1PreviewBox.hidden = false;
      p1SelectBtn.textContent = '📷 Alterar Foto da Peça';

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
      }
    };
    reader.readAsDataURL(file);
  });

  p1RemoveBtn.addEventListener('click', () => {
    p1FileInput.value = '';
    p1ImageDataUrl = null;
    p1ImageName = null;
    p1PreviewBox.hidden = true;
    p1SelectBtn.textContent = '📁 Selecionar Foto da Peça';

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

  // 5. Gerenciamento de Upload de Imagem 2 (Diagrama Pág. 3)
  p3SelectBtn.addEventListener('click', () => p3FileInput.click());

  p3FileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      p3ImageDataUrl = evt.target.result;
      p3ImageName = file.name;
      p3ThumbImg.src = p3ImageDataUrl;
      p3FileInfo.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
      p3PreviewBox.hidden = false;
      p3SelectBtn.textContent = '📐 Alterar Diagrama';

      // Atualiza ambas as versões sincronizadamente
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
  });

  p3RemoveBtn.addEventListener('click', () => {
    p3FileInput.value = '';
    p3ImageDataUrl = null;
    p3ImageName = null;
    p3PreviewBox.hidden = true;
    p3SelectBtn.textContent = '📁 Selecionar Diagrama Técnico';

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
  // 6. ACERVO DE DATASHEETS (POSTGRESQL 10.88.30.60)
  // =========================================================================
  async function searchAcervo(queryStr) {
    acervoClearBtn.hidden = !queryStr;
    acervoResultsContainer.hidden = false;
    acervoResultsContainer.className = 'acervo-results loading';
    acervoResultsContainer.textContent = 'Pesquisando no banco de dados de DataSheets...';

    try {
      const qParam = queryStr ? `?q=${encodeURIComponent(queryStr)}&limit=20` : '?limit=20';
      const resp = await fetch(`/api/datasheets/search${qParam}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const res = await resp.json();

      acervoResultsContainer.className = 'acervo-results';
      acervoResultsContainer.innerHTML = '';

      const items = res?.items || [];
      if (items.length === 0) {
        acervoResultsContainer.textContent = queryStr
          ? `Nenhum DataSheet encontrado no acervo para "${queryStr}". Você pode gerar um novo preenchendo os dados abaixo!`
          : 'Nenhum DataSheet salvo no acervo até o momento.';
        return;
      }

      const listHeader = document.createElement('div');
      listHeader.style.cssText = 'padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); font-size: 12px; color: var(--text-muted);';
      listHeader.textContent = `Encontrados: ${res.total || items.length} DataSheet(s) arquivado(s)`;
      acervoResultsContainer.appendChild(listHeader);

      const itemsGrid = document.createElement('div');
      itemsGrid.className = 'acervo-items-grid';

      for (const it of items) {
        const itemCard = document.createElement('div');
        itemCard.className = 'acervo-item-card';

        const cardTop = document.createElement('div');
        cardTop.className = 'acervo-card-top';
        const brandBadge = document.createElement('span');
        brandBadge.className = 'acervo-brand-badge';
        brandBadge.textContent = it.brand || 'OEM';
        const pnSpan = document.createElement('strong');
        pnSpan.className = 'acervo-pn-badge';
        pnSpan.textContent = `PN ${it.part_number}`;
        cardTop.append(brandBadge, pnSpan);

        const cardTitle = document.createElement('div');
        cardTitle.className = 'acervo-item-title';
        cardTitle.textContent = it.title || 'Componente Veicular';

        const cardMeta = document.createElement('div');
        cardMeta.className = 'acervo-card-meta';
        if (it.model_compat) {
          const mSpan = document.createElement('span');
          mSpan.textContent = `Modelo: ${it.model_compat}`;
          cardMeta.appendChild(mSpan);
        }
        if (it.category) {
          const cSpan = document.createElement('span');
          cSpan.textContent = `Sistema: ${it.category}`;
          cardMeta.appendChild(cSpan);
        }
        if (it.updated_at) {
          const dt = new Date(it.updated_at);
          const dateStr = !isNaN(dt.getTime()) ? dt.toLocaleDateString('pt-BR') : '';
          if (dateStr) {
            const dSpan = document.createElement('span');
            dSpan.textContent = `Atualizado em: ${dateStr}`;
            cardMeta.appendChild(dSpan);
          }
        }

        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'acervo-open-btn';
        openBtn.textContent = '⚡ Abrir Instantâneo';
        openBtn.onclick = () => loadSavedDatasheet(it);

        itemCard.append(cardTop, cardTitle, cardMeta, openBtn);
        itemsGrid.appendChild(itemCard);
      }
      acervoResultsContainer.appendChild(itemsGrid);
    } catch (err) {
      acervoResultsContainer.className = 'acervo-results error';
      acervoResultsContainer.textContent = `Erro ao consultar acervo: ${err.message}`;
    }
  }

  function clearAcervoSearch() {
    acervoSearchInput.value = '';
    acervoClearBtn.hidden = true;
    acervoResultsContainer.hidden = true;
    acervoResultsContainer.innerHTML = '';
  }

  async function loadSavedDatasheet(item) {
    try {
      acervoResultsContainer.className = 'acervo-results loading';
      acervoResultsContainer.textContent = `Carregando DataSheet ${item.brand || 'OEM'} PN ${item.part_number} do banco de dados...`;

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

      // Renderiza as páginas
      window.DatasheetRender.render(currentBilingualDoc.pt_BR, previewPtContainer);
      window.DatasheetRender.render(currentBilingualDoc.en_US, previewEnContainer);

      docActionsSection.hidden = false;
      switchLanguage('pt_BR');

      docReadyStatus.textContent = `⚡ Recuperado do Acervo (${item.brand || 'OEM'} PN ${item.part_number})`;
      forceGenerateBtn.hidden = false;
      acervoResultsContainer.hidden = true;

      previewPtContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      acervoResultsContainer.className = 'acervo-results error';
      acervoResultsContainer.textContent = `Erro ao carregar DataSheet: ${err.message}`;
    }
  }

  let acervoDebounceTimer = null;
  acervoSearchBtn.addEventListener('click', () => {
    clearTimeout(acervoDebounceTimer);
    searchAcervo(acervoSearchInput.value.trim());
  });
  acervoClearBtn.addEventListener('click', clearAcervoSearch);
  acervoSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(acervoDebounceTimer);
      searchAcervo(acervoSearchInput.value.trim());
    }
  });
  acervoSearchInput.addEventListener('input', () => {
    clearTimeout(acervoDebounceTimer);
    const val = acervoSearchInput.value.trim();
    if (val.length >= 2) {
      acervoDebounceTimer = setTimeout(() => searchAcervo(val), 350);
    } else if (val.length === 0) {
      clearAcervoSearch();
    }
  });

  // Checagem em tempo real ao digitar PN
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
    pnLookupTimer = setTimeout(checkPnInAcervo, 500);
  });
  brandSelect.addEventListener('change', () => {
    clearTimeout(pnLookupTimer);
    pnLookupTimer = setTimeout(checkPnInAcervo, 500);
  });

  // =========================================================================
  // 7. ENVIO DO FORMULÁRIO E GERAÇÃO DOS DATASHEETS BILÍNGUES
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

  // 7. Alternar Modo de Edição Inline WYSIWYG
  toggleEditBtn.addEventListener('click', () => {
    isEditing = !isEditing;
    toggleEditBtn.textContent = isEditing ? '💾 Desativar Edição' : '✏️ Ativar Edição';
    toggleEditBtn.classList.toggle('active', isEditing);

    const allEditable = document.querySelectorAll('.lang-container [data-editable]');
    allEditable.forEach(el => {
      el.contentEditable = isEditing ? 'true' : 'false';
    });
  });

  // 8. Restaurar IA Original
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

  // 9. Disparo de Impressão / Salvar PDF Oficial Isolado
  function printVersion(lang) {
    if (!currentBilingualDoc) return;

    // Garante que o idioma correto esteja ativo e visível
    switchLanguage(lang);

    const brandSafe = getSelectedBrand().replace(/[^a-zA-Z0-9_-]/g, '_');
    const pnSafe = (partNumberInput.value.trim() || 'OEM').replace(/[^a-zA-Z0-9_-]/g, '_');
    const originalTitle = document.title;

    // Configura o título da aba para sugerir o nome correto do PDF ao salvar
    document.title = `DataSheet_${lang}_${brandSafe}_${pnSafe}`;

    // Dispara a impressão imediatamente após o recálculo de estilo
    setTimeout(() => {
      window.print();
      // Restaura o título após a abertura do diálogo de impressão
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 120);
  }

  printPtBtn.addEventListener('click', () => printVersion('pt_BR'));
  printEnBtn.addEventListener('click', () => printVersion('en_US'));
});
