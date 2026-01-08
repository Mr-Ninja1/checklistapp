// Node fs removed for mobile; use payload.assets.logoDataUri instead.
// Node path removed for mobile compatibility

const escapeHtml = (s) => String(s === null || s === undefined ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const normalizeIncoming = (incoming) => {
  if (!incoming) return {};
  let v = incoming;
  if (v.payload) v = v.payload;
  if (v.meta && v.meta.payload) v = v.meta.payload;
  if (v.payload) v = v.payload;
  return v || {};
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  if (p.logoDataUri) return p.logoDataUri;
  if (p.metadata && p.metadata.logo) return p.metadata.logo;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const data = p.formData || p.data || {};
  const metadata = p.metadata || {};

  const logo = getLogoDataUri(p) || metadata.logo || null;

  const subject = data.subject || metadata.subject || 'Customer Satisfaction Questionnaire';
  const companyName = data.companyName || metadata.companyName || 'Bravo';
  const companySubtitle = data.companySubtitle || metadata.companySubtitle || '';
  const issueDate = data.issueDate || metadata.issueDate || data.formDate || metadata.formDate || '';
  const formDate = data.formDate || '';
  const formTime = data.formTime || '';
  const compiledBy = data.compiledBy || '';
  const customerName = data.customerName || '';
  const contactInfo = data.contactInfo || '';
  const mealWithin15 = data.mealWithin15 || '';
  const mealDelay = data.mealDelay || '';
  const mealOrdered = data.mealOrdered || '';
  const otherComment = data.otherComment || data.notes || '';
  const waiterName = data.waiterName || '';
  const cashierName = data.cashierName || '';
  const chefName = data.chefName || '';

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d)) return escapeHtml(String(iso));
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2,'0');
      const min = String(d.getMinutes()).padStart(2,'0');
      return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
    } catch(e){ return escapeHtml(String(iso)); }
  };
  const dateLine = formatDate(metadata.date || metadata.issueDate || p.date || metadata.createdAt || metadata.timestamp || '');

  // Flatten questions so we always render the full question text (no section titles)
  const questionsToRender = (() => {
    const pickQ = (q) => ({ question: q.question || q.text || q.label || q.name || q.prompt || '', answer: (q.answer !== undefined && q.answer !== null) ? q.answer : (q.value || q.rating || '') });
    if (Array.isArray(data.sections) && data.sections.length) return data.sections.flatMap(s => Array.isArray(s.questions) ? s.questions.map(pickQ) : []);
    if (Array.isArray(data.groups) && data.groups.length) return data.groups.flatMap(g => Array.isArray(g.questions || g.items) ? (g.questions || g.items).map(pickQ) : []);
    if (Array.isArray(data.questions) && data.questions.length) return data.questions.map(pickQ);
    // fallback — canonical full list of questions (preserve original wording, answers may be empty)
    return [
      { question: 'Was our service delivered quickly and accurately?', answer: '' },
      { question: 'Was your meal correct as per your order?', answer: '' },
      { question: 'Was the food of good quality?', answer: '' },
      { question: 'Was our service personnel polite, friendly and helpful?', answer: '' },
      { question: 'Were the tables chairs and floors clean?', answer: '' },
      { question: 'Was the shop clean at the time of your visit?', answer: '' },
      { question: 'Did the service by our personnel make you feel you were given individual attention?', answer: '' },
      { question: 'How fast was the service? At the till?', answer: '' }
    ];
  })();

  const renderQuestions = () => {
    const headerBlock = `
      <div class="section">
        <div class="label">Customer</div>
        <div>${escapeHtml(customerName)}</div>
      </div>

      <div class="section" style="margin-top:8px">
        <div class="label">Contact</div>
        <div>${escapeHtml(contactInfo)}</div>
      </div>

      <div class="section" style="margin-top:8px">
        <div class="label">Meal ordered</div>
        <div>${escapeHtml(mealOrdered)}</div>
      </div>

      <div class="section" style="margin-top:8px">
        <div class="label">Meal within 15 mins</div>
        <div>${escapeHtml(mealWithin15)}</div>
      </div>

      <div class="section" style="margin-top:8px">
        <div class="label">Meal delay</div>
        <div>${escapeHtml(mealDelay)}</div>
      </div>

      <div class="section" style="margin-top:8px">
        <div class="label">Other comments</div>
        <div>${escapeHtml(otherComment)}</div>
      </div>
      
      <div class="section" style="margin-top:8px">
        <div class="label">Staff</div>
        <div>Waiter: ${escapeHtml(waiterName)} &nbsp; Cashier: ${escapeHtml(cashierName)} &nbsp; Chef: ${escapeHtml(chefName)}</div>
      </div>`;

    const rows = (Array.isArray(questionsToRender) ? questionsToRender : []).map(q => {
      const questionText = q.question || '';
      const answer = (q.answer !== undefined && q.answer !== null) ? q.answer : '';
      return `<div class="question-row"><div class="q">${escapeHtml(questionText)}</div><div class="a">${escapeHtml(answer)}</div></div>`;
    }).join('\n');

    return headerBlock + '\n' + `<div class="section" style="margin-top:8px">${rows}</div>`;
  };

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4; margin:12mm}
    body{font-family:Arial, Helvetica, sans-serif; color:#111; margin:0; padding:12px}
    .header{display:flex; align-items:center; gap:12px; margin-bottom:8px}
    .logo{height:48px; width:auto}
    .company{font-weight:800; color:#0b62b3; font-size:20px}
    .title{font-weight:800; font-size:16px}
    .date{font-size:12px; color:#6b7280}
    .section{padding:8px; border-bottom:1px solid #e5e7eb; background:#fff}
    .section-title{font-weight:800; text-transform:uppercase; margin-bottom:8px; color:#111}
    .label{font-weight:700; color:#374151; margin-bottom:4px}
    .question-row{display:flex; align-items:center; padding:10px 8px; border:1px solid #eef2f7; margin-bottom:6px}
    .question-row .q{flex:1}
    .question-row .a{min-width:160px; text-align:right; font-weight:700}
  </style></head><body>
    <div class="header">
      ${logo ? `<img class="logo" src="${logo}"/>` : `<div style="width:48px;height:48px;background:#eee"></div>`}
      <div style="flex:1">
        <div class="company">${escapeHtml(companyName)}</div>
        ${companySubtitle ? `<div style="font-size:12px;color:#374151;">${escapeHtml(companySubtitle)}</div>` : ''}
        <div class="title">${escapeHtml(subject)}</div>
        <div class="date">${escapeHtml(dateLine)}</div>
        <div style="margin-top:6px; font-size:12px;"><strong>Form date:</strong> ${escapeHtml(formDate)} &nbsp; <strong>Time:</strong> ${escapeHtml(formTime)} &nbsp; <strong>Compiled by:</strong> ${escapeHtml(compiledBy)}</div>
      </div>
    </div>

    ${renderSections()}
</body></html>`;
};
