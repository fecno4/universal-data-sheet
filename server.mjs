import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '8098', 10);
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://10.88.30.12:11434';
const DEFAULT_MODEL = 'gemma4:26b';

const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

// Servidor 10.88.30.12: Dedicado ao Gemma (26B / Alta precisão)
const SERVER_12_ENDPOINTS = [
  'http://127.0.0.1:11434', // Túnel local para 10.88.30.12
  'http://10.88.30.12:11434' // Direto em ambiente de rede Proxmox/LXC
];

// Servidor 10.88.30.11: Dedicado ao Granite (7B MoE 1B ativo / Ultrarrápido)
const SERVER_11_ENDPOINTS = [
  'http://127.0.0.1:11435', // Túnel local para 10.88.30.11
  'http://10.88.30.11:11434' // Direto em ambiente de rede Proxmox/LXC
];

function getEndpointsForModel(modelName) {
  if (process.env.OLLAMA_URL) {
    return [process.env.OLLAMA_URL];
  }
  const name = String(modelName || '').toLowerCase();
  if (name.includes('granite')) {
    return SERVER_11_ENDPOINTS;
  }
  if (name.includes('gemma')) {
    return SERVER_12_ENDPOINTS;
  }
  return [...SERVER_12_ENDPOINTS, ...SERVER_11_ENDPOINTS];
}

async function callOllama(prompt, model = DEFAULT_MODEL) {
  const payload = {
    model: model || DEFAULT_MODEL,
    think: false,
    keep_alive: '15m',
    messages: [
      {
        role: 'system',
        content: (
          'Você é um engenheiro sênior de compras, catalogação e especificação técnica de componentes automotivos e industriais pesados, fluente em Português (Brasil) e Inglês Técnico Internacional. ' +
          'Sua tarefa é analisar as informações fornecidas (pesquisas na internet, dados de fabricante, especificações e notas de cotação) ' +
          'e redigir um DataSheet técnico formal de altíssimo rigor de engenharia em DUAS versões completas e independentes: "pt_BR" e "en_US". ' +
          'A versão em inglês deve utilizar terminologia técnica internacional padrão (ex: "Air Processing Unit", "Operating pressure", "Pneumatic connections", "Bayonet connector"). ' +
          'Responda ESTRITAMENTE em formato JSON com as chaves "pt_BR" e "en_US", sem nenhum markdown envolvente.'
        )
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    stream: false,
    format: 'json',
    options: {
      temperature: 0.1,
      top_p: 0.9,
      num_ctx: 4096,
      num_predict: 2200
    }
  };

  const endpoints = getEndpointsForModel(model);
  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 200000);

    try {
      const resp = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`Ollama HTTP ${resp.status}: ${errText}`);
      }

      const result = await resp.json();
      const rawContent = result?.message?.content || '';
      const cleanJson = rawContent.replace(/^```json\s*|\s*```$/gm, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[Ollama] Falha ao conectar em ${endpoint}: ${err.message}. Tentando próximo endpoint...`);
    }
  }

  console.error('[Ollama Error]: Todos os endpoints de IA falharam.');
  return null;
}

function buildPrompt(data) {
  const brand = data.brand || 'Fabricante OEM';
  const pn = data.part_number || 'Não informado';
  const title = data.title || 'Componente Veicular';
  const category = data.category || 'Sistemas Automotivos Pesados';
  const application = data.application || '';
  const catalogRef = data.catalog_ref || 'Catálogo Oficial';
  const position = data.position || '1';
  const quantity = data.quantity || '1';
  const externalResearch = data.external_research || '';
  const companyNotes = data.company_notes || '';

  const promptLines = [
    `Preencha e estruture os campos de engenharia para o DataSheet do seguinte componente veicular em DUAS VERSÕES ("pt_BR" e "en_US"):`,
    `- Marca / Montadora: ${brand}`,
    `- Part Number OEM Principal: ${pn}`,
    `- Nome / Título do Componente: ${title}`,
    `- Categoria / Sistema: ${category}`,
    `- Referência / Seção de Catálogo: ${catalogRef}, Posição ${position}, Quantidade por veículo: ${quantity}`,
  ];

  if (application) {
    promptLines.push(`- Aplicação / Modelos informados: ${application}`);
  }
  if (externalResearch) {
    promptLines.push(`- DADOS COLETADOS EM PESQUISA (FABRICANTE, INTERNET, FORNECEDORES):\n${externalResearch}`);
  }
  if (companyNotes) {
    promptLines.push(`- REQUISITOS E OBSERVAÇÕES DE COTAÇÃO DA EMPRESA:\n${companyNotes}`);
  }

  promptLines.push(`
DIRETRIZES TÉCNICAS MANDATÓRIAS DE ENGENHARIA:
1. Gere simultaneamente os dados para "pt_BR" (em português técnico formal brasileiro) e "en_US" (em inglês técnico automotivo internacional formal).
2. Analise profundamente o texto de pesquisa fornecido para extrair dados concretos de dimensões, peso, tensão elétrica, conexões, materiais e códigos de cross-reference (Bosch, Knorr, Wabco, ZF, etc.).
3. NUNCA invente medidas ou dados que não existam na pesquisa; quando um dado não for determinável:
   - Em pt_BR, declare: "Não localizado em fonte técnica específica para esta referência."
   - Em en_US, declare: "Not located in specific technical sources for this reference."
4. Em "aplicacao_detalhada", resuma com precisão os modelos e motores com aviso de validação por VIN/chassi.
5. Formule 2 alertas de cotação focados em riscos de compra (exigência de fotos da gravação/etiqueta, confirmação de conectores, voltagem, calibração eletrônica).

Gere rigorosamente um JSON com esta estrutura exata:
{
  "pt_BR": {
    "categoria_eyebrow": "SISTEMA EM MAIÚSCULAS (ex: SISTEMA PNEUMÁTICO DE FREIOS)",
    "componente_titulo": "NOME DO COMPONENTE EM MAIÚSCULAS (ex: VÁLVULA REGULADORA DE PRESSÃO APU)",
    "funcao_tecnica": "Descrição em 1 frase concisa e exata sobre a função técnica do componente.",
    "aplicacao_detalhada": "Resumo técnico de modelos e motores associados com recomendação de confirmação por chassi/VIN.",
    "alertas_cotacao": [
      "**Alerta 1 em negrito sobre exigência de foto, código gravado e conferência de chassi antes do embarque.**",
      "Alerta 2 sobre especificações críticas (tensão, roscas, conectores ou calibração)."
    ],
    "especificacoes": {
      "posicao_montagem": "Posição física típica no chassi/veículo ou conforme catálogo.",
      "tensao": "Tensão elétrica nominal (ex: 24V DC ou 'Não se aplica / Mecânico')",
      "material": "Material predominante (ex: Carcaça em liga de alumínio fundido)",
      "dimensoes": "Dimensões físicas aproximadas se conhecidas, senão 'Não localizado em fonte técnica específica para esta referência.'",
      "peso": "Peso líquido aproximado se conhecido, senão 'Não localizado em fonte técnica específica para esta referência.'",
      "conexoes": "Portas hidráulicas, pneumáticas (roscas M...) ou pinagem de conectores elétricos.",
      "codigo_fabricante": "Código comercial do fabricante da peça (Bosch, Knorr, Wabco, Sachs, etc.).",
      "conteudo_kit": "Não tratado como kit; cotar somente o código principal (ou detalhar se for conjunto).",
      "observacoes_tecnicas": "Notas técnicas essenciais de instalação, torques recomendados, vedação e compatibilidade."
    },
    "checklist_visual": [
      "Fotografia nítida da etiqueta ou gravação em baixo-relevo com o código completo.",
      "Geometria, conectores elétricos, portas pneumáticas/hidráulicas e pontos de fixação devem coincidir com a peça solicitada.",
      "Confirmar lado de montagem (esquerdo/direito ou dianteiro/traseiro) quando aplicável.",
      "Não aceitar equivalência baseada somente em anúncio; exigir documentação de cross-reference do fabricante.",
      "Confirmar aplicação pelo número de chassi (VIN) antes da aprovação comercial."
    ],
    "destaque_conferencia": "Localizar a posição indicada no diagrama integral e cotejar com a linha do part number. Componentes vizinhos e kits de fixação são vendidos separadamente."
  },
  "en_US": {
    "categoria_eyebrow": "SYSTEM IN UPPERCASE (e.g. PNEUMATIC BRAKE & AIR TREATMENT SYSTEM)",
    "componente_titulo": "COMPONENT NAME IN UPPERCASE (e.g. AIR PROCESSING UNIT (APU) DRYER VALVE)",
    "funcao_tecnica": "Concise 1-sentence technical description of the component function.",
    "aplicacao_detalhada": "Technical summary of associated vehicle models and engines with VIN validation requirement.",
    "alertas_cotacao": [
      "**Alert 1 in bold regarding photo requirement, stamped part number, and VIN check before shipment.**",
      "Alert 2 regarding critical specifications (voltage, thread sizes, connector pins, or calibration)."
    ],
    "especificacoes": {
      "posicao_montagem": "Typical mounting position or according to catalog.",
      "tensao": "Nominal voltage (e.g. 24V DC or 'Not applicable / Mechanical')",
      "material": "Predominant material (e.g. Cast aluminum alloy housing)",
      "dimensoes": "Approximate physical dimensions if known, otherwise 'Not located in specific technical sources for this reference.'",
      "peso": "Approximate net weight if known, otherwise 'Not located in specific technical sources for this reference.'",
      "conexoes": "Pneumatic/hydraulic ports (M... threads) or electrical connector pinout.",
      "codigo_fabricante": "Component manufacturer part number (Bosch, Knorr, Wabco, Sachs, etc.).",
      "conteudo_kit": "Not supplied as kit; quote primary part number only (or detail if assembly).",
      "observacoes_tecnicas": "Essential technical notes, recommended tightening torques, sealing, and compatibility."
    },
    "checklist_visual": [
      "Clear photograph of label or stamped OEM part number.",
      "Geometry, electrical connectors, pneumatic/hydraulic ports, and mounting points must match the requested part.",
      "Confirm mounting side (left/right or front/rear) where applicable.",
      "Do not accept equivalence based solely on sales listings; require manufacturer cross-reference documentation.",
      "Confirm application via vehicle identification number (VIN) prior to purchase approval."
    ],
    "destaque_conferencia": "Locate indicated position on complete diagram and match with primary part number line. Adjacent items and mounting kits are sold separately."
  }
}
`);

  return promptLines.join('\n');
}

function generateFallback(data) {
  const brand = (data.brand || 'MONTADORA').toUpperCase();
  const pn = data.part_number || 'OEM';
  const title = (data.title || 'COMPONENTE TÉCNICO').toUpperCase();
  const category = (data.category || 'SISTEMAS VEICULARES').toUpperCase();

  return {
    pt_BR: {
      categoria_eyebrow: `${brand} • ${category}`,
      componente_titulo: title,
      funcao_tecnica: `Componente técnico original destinado à aplicação e funcionamento no sistema ${category.toLowerCase()}.`,
      aplicacao_detalhada: data.application || `Aplicável a veículos comerciais e pesados ${brand}. A compatibilidade final deve ser validada obrigatoriamente através do número de chassi (VIN).`,
      alertas_cotacao: [
        `**Cotar exclusivamente o part number ${pn} indicado. Exigir fotografia da etiqueta, gravação ou embalagem original e confirmar aplicação pelo VIN antes do embarque.**`,
        `Confirmar especificação técnica, conectores, fixações mecânicas e compatibilidade dimensional antes da aprovação da compra.`
      ],
      especificacoes: {
        posicao_montagem: data.position ? `Posição ${data.position} conforme catálogo de montagem.` : 'Instalação conforme disposição técnica do fabricante.',
        tensao: 'Não localizado em fonte técnica específica para esta referência.',
        material: 'Carcaça de alta resistência com especificação para ambiente severo.',
        dimensoes: 'Não localizado em fonte técnica específica para esta referência.',
        peso: 'Não localizado em fonte técnica específica para esta referência.',
        conexoes: 'Conexões padronizadas conforme norma automotiva da montadora.',
        codigo_fabricante: 'Não localizado em fonte técnica específica para esta referência.',
        conteudo_kit: 'Não tratado como kit; cotar somente o código principal.',
        observacoes_tecnicas: data.company_notes ? `Requisito do solicitante: ${data.company_notes}` : 'Seguir as normas de montagem e torques especificados nos manuais de serviço da montadora.'
      },
      checklist_visual: [
        'Fotografia nítida da etiqueta ou gravação em baixo-relevo com o código completo.',
        'Geometria, conectores elétricos, portas pneumáticas/hidráulicas e pontos de fixação devem coincidir com a peça solicitada.',
        'Confirmar lado de montagem (esquerdo/direito ou dianteiro/traseiro) quando aplicável.',
        'Não aceitar equivalência baseada somente em anúncio; exigir documentação de cross-reference do fabricante.',
        'Confirmar aplicação pelo número de chassi (VIN) antes da aprovação comercial.'
      ],
      destaque_conferencia: `Localizar a posição indicada no diagrama e cotejar com o part number ${pn}. Itens vizinhos são vendidos separadamente.`
    },
    en_US: {
      categoria_eyebrow: `${brand} • ${category}`,
      componente_titulo: title,
      funcao_tecnica: `Original technical component engineered for operation within the ${category.toLowerCase()} system.`,
      aplicacao_detalhada: data.application || `Applicable to ${brand} commercial and heavy-duty vehicles. Final fitment must be validated via vehicle identification number (VIN).`,
      alertas_cotacao: [
        `**Quote strictly the specified part number ${pn}. Require clear photograph of label, stamped code, or OEM packaging and verify application by VIN prior to shipment.**`,
        `Confirm technical specifications, electrical connectors, mechanical mountings, and dimensional compatibility prior to procurement approval.`
      ],
      especificacoes: {
        posicao_montagem: data.position ? `Position ${data.position} according to assembly catalog.` : 'Mounting according to OEM technical layout.',
        tensao: 'Not located in specific technical sources for this reference.',
        material: 'Heavy-duty housing specified for severe operating environments.',
        dimensoes: 'Not located in specific technical sources for this reference.',
        peso: 'Not located in specific technical sources for this reference.',
        conexoes: 'Standardized connections compliant with OEM automotive standards.',
        codigo_fabricante: 'Not located in specific technical sources for this reference.',
        conteudo_kit: 'Not supplied as kit; quote primary part number only.',
        observacoes_tecnicas: data.company_notes ? `Client requirement: ${data.company_notes}` : 'Follow assembly standards and torque specifications provided in OEM service manuals.'
      },
      checklist_visual: [
        'Clear photograph of label or stamped OEM part number.',
        'Geometry, electrical connectors, pneumatic/hydraulic ports, and mounting points must match the requested part.',
        'Confirm mounting side (left/right or front/rear) where applicable.',
        'Do not accept equivalence based solely on sales listings; require manufacturer cross-reference documentation.',
        'Confirm application via vehicle identification number (VIN) prior to purchase approval.'
      ],
      destaque_conferencia: `Locate indicated position on diagram and match with part number ${pn}. Adjacent items and hardware are sold separately.`
    }
  };
}

function assembleSingleDocument(reqData, aiData, lang = 'pt_BR') {
  const brand = (reqData.brand || 'OEM').trim();
  const brandUpper = brand.toUpperCase();
  const pn = String(reqData.part_number || '').trim();
  const isEn = lang === 'en_US';

  const fontes = [];
  if (reqData.sources && Array.isArray(reqData.sources) && reqData.sources.length > 0) {
    for (const s of reqData.sources) {
      if (s && s.trim()) fontes.push(s.trim());
    }
  }
  if (fontes.length === 0) {
    if (isEn) {
      fontes.push(`OEM technical catalog and engineering documentation for ${brand}.`);
      if (reqData.external_research) {
        fontes.push('Technical market research, manufacturer literature, and authorized supplier cross-references.');
      }
      if (reqData.company_notes) {
        fontes.push('Procurement guidelines and technical requirements supplied by client operator.');
      }
    } else {
      fontes.push(`Catálogo técnico e documentação de engenharia do fabricante ${brand}.`);
      if (reqData.external_research) {
        fontes.push('Pesquisa técnica de mercado, literatura de fabricante e dados de fornecedores homologados.');
      }
      if (reqData.company_notes) {
        fontes.push('Requisitos comerciais e diretrizes fornecidas pelo operador.');
      }
    }
  }

  // Rótulos localizados das 16 especificações
  const specLabels = isEn ? {
    componente: 'Component',
    part_number: 'Primary Part Number',
    montadora: 'Vehicle Manufacturer / OEM',
    descricao: 'Formal Technical Description',
    funcao: 'Function',
    aplicacao: 'Application',
    posicao: 'Mounting Position',
    tensao: 'Voltage',
    material: 'Material',
    dimensoes: 'Dimensions',
    peso: 'Weight',
    conexoes: 'Connections / Ports',
    quantidade: 'Supplied Quantity',
    codigo_fab: 'Component Manufacturer Code',
    kit: 'Kit Content',
    observacoes: 'Technical Notes'
  } : {
    componente: 'Componente',
    part_number: 'Part number principal',
    montadora: 'Fabricante do veículo / Montadora',
    descricao: 'Descrição técnica formal',
    funcao: 'Função',
    aplicacao: 'Aplicação',
    posicao: 'Posição de montagem',
    tensao: 'Tensão',
    material: 'Material',
    dimensoes: 'Dimensões',
    peso: 'Peso',
    conexoes: 'Conexões',
    quantidade: 'Quantidade fornecida',
    codigo_fab: 'Código do fabricante da peça',
    kit: 'Conteúdo de kit',
    observacoes: 'Observações técnicas'
  };

  const naText = isEn
    ? 'Not located in specific technical sources for this reference.'
    : 'Não localizado em fonte técnica específica para esta referência.';

  const metrics = isEn ? [
    { label: 'OEM Part Number', value: pn },
    { label: 'Manufacturer', value: brand },
    { label: 'Catalog / Section', value: reqData.catalog_ref || 'General Catalog' },
    { label: 'Quantity', value: String(reqData.quantity || '1') }
  ] : [
    { label: 'Código OEM', value: pn },
    { label: 'Fabricante', value: brand },
    { label: 'Catálogo / Grupo', value: reqData.catalog_ref || 'Catálogo Geral' },
    { label: 'Quantidade', value: String(reqData.quantity || '1') }
  ];

  return {
    lang: lang,
    header: {
      brand: brand,
      title: isEn ? `TECHNICAL PART DATASHEET - ${brandUpper}` : `DATASHEET TÉCNICO DE PEÇA - ${brandUpper}`,
      part_number: pn,
      subtitle: isEn
        ? `Technical document for ${brand} component identification and RFQ quotation - does not replace VIN validation`
        : `Documento técnico para identificação e cotação de componentes ${brand} - não substitui validação por VIN`,
      total_pages: 3,
      page_label_prefix: isEn ? 'Page' : 'Página',
      page_label_of: isEn ? 'of' : 'de'
    },
    page1: {
      eyebrow: aiData.categoria_eyebrow || (isEn ? `${brandUpper} • MECHANICAL & ELECTRICAL SYSTEMS` : `${brandUpper} • SISTEMAS MECÂNICOS E ELETRÔNICOS`),
      title: aiData.componente_titulo || (reqData.title || (isEn ? 'AUTOMOTIVE COMPONENT' : 'COMPONENTE AUTOMOTIVO')).toUpperCase(),
      part_number_heading: isEn ? `PRIMARY PART NUMBER: ${pn}` : `PART NUMBER PRINCIPAL: ${pn}`,
      brand_badge: brandUpper,
      image_data_url: reqData.image_p1_data_url || null,
      image_name: reqData.image_p1_name || null,
      metrics: metrics,
      application_title: isEn ? 'Primary application' : 'Aplicação principal',
      application: aiData.aplicacao_detalhada || reqData.application || (isEn ? `Application in ${brand} commercial vehicles. Validate via chassis/VIN.` : `Aplicação em veículos comerciais ${brand}. Validar com chassi/VIN.`),
      callouts: aiData.alertas_cotacao || []
    },
    page2: {
      title: isEn ? 'Technical specifications' : 'Especificações técnicas',
      specs: [
        { label: specLabels.componente, value: aiData.componente_titulo || reqData.title || (isEn ? 'Automotive Component' : 'Componente Automotivo') },
        { label: specLabels.part_number, value: pn },
        { label: specLabels.montadora, value: brand },
        { label: specLabels.descricao, value: reqData.title || aiData.componente_titulo || (isEn ? 'Automotive Part' : 'Peça Automotiva') },
        { label: specLabels.funcao, value: aiData.funcao_tecnica || naText },
        { label: specLabels.aplicacao, value: aiData.aplicacao_detalhada || naText },
        { label: specLabels.posicao, value: aiData.especificacoes?.posicao_montagem || (isEn ? 'According to OEM assembly catalog.' : 'Conforme catálogo da montadora.') },
        { label: specLabels.tensao, value: aiData.especificacoes?.tensao || naText },
        { label: specLabels.material, value: aiData.especificacoes?.material || naText },
        { label: specLabels.dimensoes, value: aiData.especificacoes?.dimensoes || naText },
        { label: specLabels.peso, value: aiData.especificacoes?.peso || naText },
        { label: specLabels.conexoes, value: aiData.especificacoes?.conexoes || naText },
        { label: specLabels.quantidade, value: String(reqData.quantity || '1') },
        { label: specLabels.codigo_fab, value: aiData.especificacoes?.codigo_fabricante || naText },
        { label: specLabels.kit, value: aiData.especificacoes?.conteudo_kit || (isEn ? 'Not supplied as kit; quote primary part number only.' : 'Não tratado como kit; cotar somente o código principal.') },
        { label: specLabels.observacoes, value: aiData.especificacoes?.observacoes_tecnicas || naText }
      ],
      checklist_title: isEn ? 'Visual inspection & procurement checklist' : 'Checklist visual e de fornecimento',
      checklist_items: aiData.checklist_visual || [],
      confirmation_limit_title: isEn ? 'Confirmation limit' : 'Limite de confirmação',
      confirmation_limit: isEn
        ? `The data above was structured through engineering analysis of the technical baseline and public references consulted for part number ${pn} (${brand}).`
        : `Os dados acima foram estruturados por análise de engenharia sobre a base técnica e referências públicas consultadas para o código ${pn} (${brand}).`
    },
    page3: {
      title: isEn ? 'Catalog & validation' : 'Catálogo e validação',
      subtitle: isEn
        ? `${brand} - catalog reference: ${reqData.catalog_ref || 'General'} | indicated position: ${reqData.position || '1'}`
        : `${brand} - referência/catálogo: ${reqData.catalog_ref || 'Geral'} | posição indicada: ${reqData.position || '1'}`,
      image_data_url: reqData.image_p3_data_url || null,
      image_name: reqData.image_p3_name || null,
      indicated_position: String(reqData.position || '1'),
      highlight_title: isEn ? 'Inspection highlight: ' : 'Destaque de conferência: ',
      highlight_note: aiData.destaque_conferencia || (isEn
        ? `Match received component with primary part number ${pn} and technical references. Adjacent items and mounting kits are sold separately.`
        : `Cotejar o componente recebido com o part number ${pn} e a referência técnica. Itens vizinhos e conjuntos de fixação não fazem parte desta cotação.`),
      sources_title: isEn ? 'Consulted sources' : 'Fontes consultadas',
      sources: fontes,
      disclaimer: isEn
        ? `Application subject to technical confirmation via VIN, chassis number, and vehicle configuration. Images and diagrams serve for positional and geometric identification only; they do not replace physical inspection of the part and manufacturer label.`
        : `Aplicação sujeita à confirmação técnica pelo VIN, número de chassi e configuração do veículo. Imagens e diagramas servem à identificação posicional e geométrica; não substituem fotografia da peça física e da etiqueta recebida do fornecedor.`
    }
  };
}

function assembleBilingualDocument(reqData, aiData) {
  // Garante que ambos os lados existam mesmo se a IA tiver falhado parcialmente
  const fallback = generateFallback(reqData);
  const ptData = (aiData && aiData.pt_BR && aiData.pt_BR.funcao_tecnica) ? aiData.pt_BR : fallback.pt_BR;
  const enData = (aiData && aiData.en_US && aiData.en_US.funcao_tecnica) ? aiData.en_US : fallback.en_US;

  return {
    pt_BR: assembleSingleDocument(reqData, ptData, 'pt_BR'),
    en_US: assembleSingleDocument(reqData, enData, 'en_US')
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', app: 'Universal-DataSheet-Studio', port: PORT }));
    return;
  }

  // API endpoint de geração de DataSheet
  if (pathname === '/api/datasheets/generate' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => {
      bodyStr += chunk;
      if (bodyStr.length > 25 * 1024 * 1024) { // Limite de 25MB
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Carga de dados excede o limite permitido' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const reqData = JSON.parse(bodyStr || '{}');

        if (!reqData.part_number || !String(reqData.part_number).trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'O Part Number principal é obrigatório.' }));
          return;
        }

        const model = reqData.model || DEFAULT_MODEL;
        console.log(`[DataSheet] Solicitado para marca: ${reqData.brand || 'OEM'}, PN: ${reqData.part_number} via IA: ${model}`);

        const prompt = buildPrompt(reqData);
        let aiData = await callOllama(prompt, model);

        if (!aiData) {
          console.warn('[DataSheet] IA indisponível. Utilizando fallback determinístico.');
          aiData = generateFallback(reqData);
        } else if (!aiData.pt_BR && aiData.funcao_tecnica) {
          // IA retornou objeto simples sem as chaves pt_BR / en_US
          aiData = {
            pt_BR: aiData,
            en_US: generateFallback(reqData).en_US
          };
        }

        const bilingualDoc = assembleBilingualDocument(reqData, aiData);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(bilingualDoc));
      } catch (err) {
        console.error('[Generate Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Falha interna na geração do DataSheet: ${err.message}` }));
      }
    });
    return;
  }

  // Servir arquivos estáticos do diretório public
  if (req.method === 'GET' || req.method === 'HEAD') {
    let safePath = pathname;
    if (safePath === '/' || safePath === '') safePath = '/index.html';
    const filePath = path.join(PUBLIC_DIR, safePath);

    // Proteção contra Directory Traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Acesso negado');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Arquivo não encontrado');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Método não permitido');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log(`🚀 Universal DataSheet Studio (Multimarcas) iniciado!`);
  console.log(`🌐 Acesso Local: http://localhost:${PORT}`);
  console.log(`🤖 Servidor IA Ollama: ${OLLAMA_BASE_URL} (Modelo padrão: ${DEFAULT_MODEL})`);
  console.log('================================================================');
});
