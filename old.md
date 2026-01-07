// Generate HTML preview for known form types
ipcMain.handle('generate-form-html', async (event, payloadWrapper) => {
  try {
    const p = payloadWrapper && payloadWrapper.payload ? payloadWrapper.payload : payloadWrapper || {};

    const candidates = [];
    const pushNorm = (v) => {
      if (!v) return;
      try { const s = String(v).replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); if (s) candidates.push(s); } catch (e) {}
    };
    pushNorm(p.title);
    pushNorm(p.formType);
    pushNorm(p.formTypeName);
    pushNorm(p.name);
    pushNorm(p.metadata && p.metadata.subject);
    pushNorm(p.metadata && p.metadata.location);

    const explicitMapping = {
      'foh': 'generate_foh_frontofhouse_html.js',
      'fohdailycleaningpresentational': 'generate_foh_frontofhouse_html.js',
      'frontofhouse': 'generate_foh_frontofhouse_html.js',
      'frontofhousecleaning': 'generate_foh_frontofhouse_html.js',
      'thawingtemperature': 'generate_thawingtemperature_html.js',
      'thawing': 'generate_thawingtemperature_html.js',
      'thawingtemperaturelog': 'generate_thawingtemperature_html.js',
      'thawingtemperaturepresentational': 'generate_thawingtemperature_html.js',
      'productrejection': 'generate_productrejection_html.js',
      'drygoodsreceiving': 'generate_drygoodsreceiving_html.js',
      'toolboxtalkregister': 'generate_toolboxtalkregister_html.js',
      'foodhandlersdailyshowering': 'generate_foodhandlers_daily_showering_html.js',
      'foodhandlersdailyshower': 'generate_foodhandlers_daily_showering_html.js',
      'foodhandlersdailyshoweringpresentational': 'generate_foodhandlers_daily_showering_html.js'
    };

    const rawTitle = (p.title || p.formType || p.name || '').toString().toLowerCase();
    if (rawTitle.includes('kitchen') && (rawTitle.includes('sanitiz') || rawTitle.includes('clean'))) candidates.push('kitchendailycleaning');
    if (rawTitle.includes('food contact') || rawTitle.includes('foodcontact')) candidates.push('kitchendailycleaning');
    if (rawTitle.includes('food handlers') || rawTitle.includes('foodhandlers') || rawTitle.includes('handwashing') || rawTitle.includes('hand wash')) {
      candidates.push('foodhandlers');
      candidates.push('foodhandlersdailyhandwashing');
    }
    if (rawTitle.includes('ppe') || rawTitle.includes('personal') || rawTitle.includes('protect')) {
      candidates.push('ppe');
      candidates.push('personalprotectiveequipment');
    }

    const fs = require('fs');
    const exportersDir = path.join(__dirname, 'src', 'exporters', 'html');
    const files = fs.readdirSync(exportersDir).filter(f => f && f.toLowerCase().endsWith('.js'));

    // 1. Check Payload Override
    const overrideKey = (p.exporter || (p.metadata && p.metadata.exporter) || '').toString().trim();
    if (overrideKey) {
      let mapped = overrideKey;
      const norm = mapped.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (!mapped.toLowerCase().endsWith('.js')) {
        const found = files.find(f => f.toLowerCase().includes(norm) || f.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === norm);
        if (found) mapped = found;
      }
      if (files.includes(mapped)) {
        const modPath = path.join(exportersDir, mapped);
        delete require.cache[require.resolve(modPath)];
        const gen = require(modPath);
        const fn = gen && (gen.default || gen);
        if (typeof fn === 'function') return { ok: true, html: fn(payloadWrapper) };
      }
    }

    // 2. Check Explicit Mapping
    for (const c of candidates) {
      const mapped = explicitMapping[c];
      if (mapped && files.includes(mapped)) {
        const modPath = path.join(exportersDir, mapped);
        delete require.cache[require.resolve(modPath)];
        const gen = require(modPath);
        const fn = gen && (gen.default || gen);
        if (typeof fn === 'function') return { ok: true, html: fn(payloadWrapper) };
      }
    }

    // 3. Scoring fallback
    const longestCommonSubstring = (a, b) => {
      if (!a || !b) return 0;
      const m = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
      let longest = 0;
      for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
          if (a[i] === b[j]) {
            m[i + 1][j + 1] = m[i][j] + 1;
            if (m[i + 1][j + 1] > longest) longest = m[i + 1][j + 1];
          }
        }
      }
      return longest;
    };

    let best = { score: 0, file: null };
    for (const f of files) {
      const base = f.replace(/^generate/i, '').replace(/html\.js$/i, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      let score = 0;
      for (const c of candidates) {
        if (c === base) score += 10000;
        else if (c.includes(base) || base.includes(c)) score += 100 + Math.max(base.length, c.length);
        else score += longestCommonSubstring(base, c);
      }
      if (score > best.score) best = { score, file: f };
    }

    if (best.file) {
      const modPath = path.join(exportersDir, best.file);
      delete require.cache[require.resolve(modPath)];
      const gen = require(modPath);
      const fn = gen && (gen.default || gen);
      if (typeof fn === 'function') return { ok: true, html: fn(payloadWrapper) };
    }

    return { ok: false, error: 'No generator found' };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});