/* ============================================================
   IMPORTER.JS — Facebook Group CSV & URL Paste Import
   Part 1: Parsing, deduplication, core logic
   ============================================================ */
'use strict';

const Importer = (() => {

  let _rows = []; // parsed rows pending import

  /* ── Extract all Facebook group URLs from any text ── */
  function extractFBUrls(text) {
    const re = /https?:\/\/(?:www\.)?facebook\.com\/groups\/[^\s,'"<>\]\n]+/gi;
    const found = text.match(re) || [];
    return [...new Set(found.map(u => u.replace(/[/?#].*$/, '').replace(/\/+$/, '').trim()))];
  }

  /* ── Convert URL slug to readable name ── */
  function slugToName(url) {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      const slug = parts[parts.length - 1] || '';
      if (/^\d+$/.test(slug)) return 'Facebook Group';
      return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
    } catch { return 'Facebook Group'; }
  }

  /* ── Normalize language value ── */
  function normLang(val) {
    const v = (val || '').toLowerCase().trim();
    if (/^(nl|dutch|ned|neder)/.test(v)) return 'nl';
    if (/^(es|spa|esp|span)/.test(v))   return 'es';
    return 'en';
  }

  /* ── Normalize category value ── */
  function normCat(val) {
    const v = (val || '').toLowerCase();
    if (/vacation|rental|verhuur|huur|alquiler|vr/.test(v)) return 'vacation rental';
    if (/real.?estate|vastgoed|inmobil/.test(v))            return 'real estate';
    if (/market|markt|koop|venta/.test(v))                  return 'marketplace';
    if (/expat/.test(v))                                    return 'expat';
    return 'general';
  }

  /* ── Parse CSV text into rows ── */
  function parseCSV(text) {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];

    // Detect delimiter
    const firstLine = lines[0];
    const delim = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    function splitLine(line) {
      const vals = []; let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; }
        else if (ch === delim && !inQ) { vals.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      vals.push(cur.trim());
      return vals.map(v => v.replace(/^"+|"+$/g, '').trim());
    }

    const headers = splitLine(firstLine).map(h => h.toLowerCase().replace(/\s+/g, ''));
    const knownHeaders = ['name','url','link','language','lang','category','cat','notes'];
    const hasHeaders = headers.some(h => knownHeaders.includes(h));

    let iName = -1, iUrl = -1, iLang = -1, iCat = -1, iNotes = -1;
    if (hasHeaders) {
      headers.forEach((h, i) => {
        if (/^(name|groupname)$/.test(h))        iName  = i;
        else if (/^(url|link|groupurl)$/.test(h)) iUrl   = i;
        else if (/^(lang|language)$/.test(h))     iLang  = i;
        else if (/^(cat|category)$/.test(h))      iCat   = i;
        else if (/^(note|notes)$/.test(h))        iNotes = i;
      });
    }

    const rows = [];
    const startIdx = hasHeaders ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const vals = splitLine(lines[i]);
      let url = '', name = '', lang = 'en', cat = 'general', notes = '';

      if (hasHeaders) {
        url   = iUrl   >= 0 ? (vals[iUrl]   || '') : '';
        name  = iName  >= 0 ? (vals[iName]  || '') : '';
        lang  = normLang(iLang  >= 0 ? vals[iLang]  : 'en');
        cat   = normCat (iCat   >= 0 ? vals[iCat]   : 'general');
        notes = iNotes >= 0 ? (vals[iNotes] || '') : '';
      } else {
        // Try to find URL in any column
        const urlIdx = vals.findIndex(v => /facebook\.com\/groups\//i.test(v));
        if (urlIdx >= 0) {
          url  = vals[urlIdx].replace(/\/+$/, '');
          name = urlIdx > 0 ? vals[0] : (vals[1] || '');
        }
      }

      // Fallback: extract FB URL from the whole line text
      if (!url || !/facebook\.com\/groups\//i.test(url)) {
        const extracted = extractFBUrls(lines[i]);
        if (!extracted.length) continue;
        url = extracted[0];
      }

      url = url.replace(/\/+$/, '').trim();
      if (!name) name = slugToName(url);

      rows.push({ name, url, language: lang, category: cat, notes });
    }
    return rows;
  }

  /* ── Parse plain URL list ── */
  function parseURLList(text) {
    // First try extracting FB-specific URLs
    const fbUrls = extractFBUrls(text);
    if (fbUrls.length) {
      return fbUrls.map(url => ({
        name: slugToName(url), url, language: 'en', category: 'general', notes: ''
      }));
    }
    // Fallback: any http URL per line
    return text.trim().split('\n')
      .map(l => l.trim())
      .filter(l => /^https?:\/\//i.test(l))
      .map(url => ({
        name: slugToName(url), url: url.replace(/\/+$/, ''), language: 'en', category: 'general', notes: ''
      }));
  }

  /* ── Deduplicate rows (by URL, case-insensitive) ── */
  function deduplicateRows(rows) {
    const seen = new Set();
    return rows.filter(r => {
      const key = (r.url || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /* ── Flag rows that already exist in the group list ── */
  function flagDuplicates(rows) {
    const existing = new Set(
      Store.getGroups().map(g => (g.url || '').toLowerCase().replace(/\/+$/, ''))
    );
    return rows.map(r => ({
      ...r,
      isDuplicate: existing.has((r.url || '').toLowerCase().replace(/\/+$/, ''))
    }));
  }

  /* ── Update a pending row's field ── */
  function updateRow(idx, field, value) {
    if (_rows[idx]) _rows[idx][field] = value;
  }

  /* ── Select-all toggle ── */
  function toggleAll(checked) {
    document.querySelectorAll('.import-row-check').forEach(cb => { cb.checked = checked; });
  }

  /* ── Execute the import ── */
  function executeImport() {
    const checks = document.querySelectorAll('.import-row-check');
    const selected = [];
    checks.forEach((cb, i) => { if (cb.checked && _rows[i]) selected.push(_rows[i]); });

    if (!selected.length) { App.toast('No rows selected.', 'warning'); return; }

    const replaceSamples = document.getElementById('importReplaceSamples')?.checked;
    if (replaceSamples) {
      const groups = Store.getGroups().filter(g => g.source !== 'sample');
      Store.saveGroups(groups);
    }

    let added = 0;
    const existingUrls = new Set(Store.getGroups().map(g => (g.url || '').toLowerCase()));
    for (const row of selected) {
      const key = (row.url || '').toLowerCase();
      if (existingUrls.has(key)) continue; // skip duplicates
      Store.addGroup(Store.createGroup({
        name: row.name, url: row.url,
        language: row.language, category: row.category,
        notes: row.notes, source: 'imported'
      }));
      existingUrls.add(key);
      added++;
    }

    App.closeModal();
    Views.renderGroups();
    App.toast(`${added} group${added !== 1 ? 's' : ''} imported successfully!`, 'success');
  }

  /* ── Parse & preview from CSV text ── */
  function parseAndPreviewCSV(text) {
    if (!text || text.trim().length < 5) {
      document.getElementById('importPreviewArea').innerHTML = '';
      return;
    }
    const parsed = parseCSV(text);
    _rows = flagDuplicates(deduplicateRows(parsed));
    renderPreview();
  }

  /* ── Parse & preview from URL paste ── */
  function parseAndPreviewURLs() {
    const text = (document.getElementById('urlPasteText') || {}).value || '';
    const parsed = parseURLList(text);
    _rows = flagDuplicates(deduplicateRows(parsed));
    renderPreview();
  }

  /* ── Handle file select ── */
  function handleFileSelect(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      document.getElementById('csvPasteText').value = text;
      parseAndPreviewCSV(text);
    };
    reader.readAsText(file, 'UTF-8');
  }

  /* ── Handle drag & drop ── */
  function handleFileDrop(event) {
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      document.getElementById('csvPasteText').value = text;
      parseAndPreviewCSV(text);
    };
    reader.readAsText(file, 'UTF-8');
  }

  /* ── Switch tabs ── */
  function switchTab(tab) {
    const isCSV = tab === 'csv';
    document.getElementById('importTabCSV').style.display   = isCSV ? 'block' : 'none';
    document.getElementById('importTabPaste').style.display = isCSV ? 'none'  : 'block';
    document.getElementById('tabCSV').style.cssText   = isCSV
      ? 'padding:10px 20px;border:none;background:none;font-size:13.5px;font-weight:700;cursor:pointer;border-bottom:2px solid var(--brand-orange);margin-bottom:-2px;color:var(--brand-orange)'
      : 'padding:10px 20px;border:none;background:none;font-size:13.5px;font-weight:500;cursor:pointer;color:var(--text-secondary)';
    document.getElementById('tabPaste').style.cssText = isCSV
      ? 'padding:10px 20px;border:none;background:none;font-size:13.5px;font-weight:500;cursor:pointer;color:var(--text-secondary)'
      : 'padding:10px 20px;border:none;background:none;font-size:13.5px;font-weight:700;cursor:pointer;border-bottom:2px solid var(--brand-orange);margin-bottom:-2px;color:var(--brand-orange)';
    document.getElementById('importPreviewArea').innerHTML = '';
    _rows = [];
  }

  /* ── Render preview table ── */
  function renderPreview() {
    const area = document.getElementById('importPreviewArea');
    if (!area) return;

    if (!_rows.length) {
      area.innerHTML = '<div class="alert alert-warning">⚠️ No valid Facebook group URLs found. Check your input.</div>';
      return;
    }

    function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    const newCount = _rows.filter(r => !r.isDuplicate).length;
    const dupCount = _rows.filter(r =>  r.isDuplicate).length;

    const langOpts = (sel) => ['en','nl','es'].map(l =>
      `<option value="${l}" ${sel===l?'selected':''}>${{en:'🇬🇧 EN',nl:'🇳🇱 NL',es:'🇪🇸 ES'}[l]}</option>`).join('');
    const catOpts = (sel) => ['vacation rental','real estate','marketplace','expat','general'].map(c =>
      `<option value="${c}" ${sel===c?'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('');

    area.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <span class="badge badge-ready">${newCount} new</span>
        ${dupCount ? `<span class="badge badge-used">${dupCount} already exist (unchecked by default)</span>` : ''}
        <span style="font-size:12px;color:var(--text-muted);margin-left:auto">Edit name, language & category before importing</span>
      </div>
      <div class="table-wrap" style="max-height:300px;overflow-y:auto">
        <table>
          <thead>
            <tr>
              <th style="width:30px"><input type="checkbox" id="importSelectAll" checked onchange="Importer._toggleAll(this.checked)"></th>
              <th>Name</th>
              <th>URL</th>
              <th>Lang</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${_rows.map((r, i) => `
              <tr style="${r.isDuplicate?'background:#FFFBEB;':''}">
                <td><input type="checkbox" class="import-row-check" data-idx="${i}" ${!r.isDuplicate?'checked':''} id="irc-${i}"></td>
                <td><input type="text" style="border:1.5px solid var(--border-medium);border-radius:4px;padding:5px 8px;font-size:12px;width:160px;font-family:inherit" value="${esc(r.name)}" oninput="Importer._updateRow(${i},'name',this.value)"></td>
                <td style="max-width:160px"><a href="${esc(r.url)}" target="_blank" rel="noopener" style="font-size:11px;color:var(--brand-sea);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block" title="${esc(r.url)}">${esc(r.url.replace('https://www.facebook.com/groups/','').replace('https://facebook.com/groups/',''))}</a></td>
                <td><select style="border:1.5px solid var(--border-medium);border-radius:4px;padding:4px;font-size:12px;font-family:inherit" onchange="Importer._updateRow(${i},'language',this.value)">${langOpts(r.language)}</select></td>
                <td><select style="border:1.5px solid var(--border-medium);border-radius:4px;padding:4px;font-size:12px;font-family:inherit" onchange="Importer._updateRow(${i},'category',this.value)">${catOpts(r.category)}</select></td>
                <td>${r.isDuplicate?'<span class="badge badge-used">Exists</span>':'<span class="badge badge-ready">New</span>'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="form-group" style="margin-top:16px">
        <label class="checkbox-label">
          <input type="checkbox" id="importReplaceSamples">
          Remove <strong>sample groups</strong> before importing (keeps your manually added groups)
        </label>
        <div class="form-hint">Only removes groups that were pre-loaded as example data — not groups you added manually.</div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="Importer._executeImport()">⬆️ Import Selected</button>
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      </div>`;
  }

  /* ── Open the import modal ── */
  function showImportModal() {
    _rows = [];
    document.getElementById('modalTitle').textContent = 'Import Facebook Groups';
    document.getElementById('modalBody').innerHTML = `
      <div style="display:flex;gap:0;border-bottom:2px solid var(--border-light);margin-bottom:20px">
        <button id="tabCSV" onclick="Importer._switchTab('csv')"
          style="padding:10px 20px;border:none;background:none;font-size:13.5px;font-weight:700;cursor:pointer;border-bottom:2px solid var(--brand-orange);margin-bottom:-2px;color:var(--brand-orange)">
          📄 Upload / Paste CSV
        </button>
        <button id="tabPaste" onclick="Importer._switchTab('paste')"
          style="padding:10px 20px;border:none;background:none;font-size:13.5px;font-weight:500;cursor:pointer;color:var(--text-secondary)">
          📋 Paste URLs
        </button>
      </div>

      <div id="importTabCSV">
        <div class="alert alert-info" style="margin-bottom:14px">
          <strong>Supported formats:</strong><br>
          <span style="font-size:12px">• Simple: one URL per row &nbsp;•&nbsp; Full CSV with headers: <code>name, url, language, category, notes</code><br>
          • Delimiters: comma, semicolon, or tab &nbsp;•&nbsp; Drag &amp; drop or click to upload</span>
        </div>
        <div id="importDropZone"
          style="border:2px dashed var(--border-medium);border-radius:var(--radius-md);padding:28px;text-align:center;cursor:pointer;transition:border-color .2s;margin-bottom:14px"
          onclick="document.getElementById('csvFileInput').click()"
          ondragover="event.preventDefault();this.style.borderColor='var(--brand-orange)'"
          ondragleave="this.style.borderColor='var(--border-medium)'"
          ondrop="event.preventDefault();this.style.borderColor='var(--border-medium)';Importer._handleFileDrop(event)">
          <div style="font-size:36px;margin-bottom:8px">📂</div>
          <div style="font-size:14px;font-weight:600;color:var(--text-primary)">Click or drag &amp; drop your CSV file</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">.csv and .txt files supported</div>
        </div>
        <input type="file" id="csvFileInput" accept=".csv,.txt" style="display:none" onchange="Importer._handleFileSelect(this)">
        <div style="text-align:center;color:var(--text-muted);font-size:12px;margin-bottom:10px">— or paste CSV text directly —</div>
        <textarea class="form-control" id="csvPasteText" rows="5"
          placeholder="Paste CSV or URLs here — we'll detect the format automatically…"
          oninput="Importer._parseAndPreviewCSV(this.value)"></textarea>
      </div>

      <div id="importTabPaste" style="display:none">
        <div class="alert alert-info" style="margin-bottom:14px">
          Paste one Facebook group URL per line, or paste any text containing Facebook group URLs — we'll extract them automatically.
        </div>
        <textarea class="form-control" id="urlPasteText" rows="10"
          placeholder="https://www.facebook.com/groups/curacao-vacation-rentals&#10;https://www.facebook.com/groups/expats-curacao&#10;..."></textarea>
        <button class="btn btn-sea" style="margin-top:12px" onclick="Importer._parseAndPreviewURLs()">
          🔍 Parse &amp; Preview
        </button>
      </div>

      <div id="importPreviewArea" style="margin-top:20px"></div>`;

    App.openModal();
  }

  /* ── Public API ── */
  return {
    showImportModal,
    _switchTab:           switchTab,
    _parseAndPreviewCSV:  parseAndPreviewCSV,
    _parseAndPreviewURLs: parseAndPreviewURLs,
    _handleFileSelect:    handleFileSelect,
    _handleFileDrop:      handleFileDrop,
    _updateRow:           updateRow,
    _toggleAll:           toggleAll,
    _executeImport:       executeImport
  };
})();
