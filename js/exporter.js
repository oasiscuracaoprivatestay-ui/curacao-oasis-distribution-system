/* ============================================================
   EXPORTER.JS — CSV Export for all 4 data types
   ============================================================ */
'use strict';

const Exporter = (() => {

  /* ── CSV helpers ── */
  function escCSV(val) {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
  }

  function buildCSV(headers, rows) {
    const head = headers.map(escCSV).join(',');
    const body = rows.map(r => r.map(escCSV).join(',')).join('\n');
    return head + '\n' + body;
  }

  function download(csv, filename) {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function dateStr() {
    return new Date().toISOString().split('T')[0];
  }

  /* ── Export: Posting History ── */
  function exportHistory() {
    const logs = Store.getLogs();
    const headers = ['Date Posted', 'Content Title', 'Group Name', 'Language', 'Content Type', 'Post Text', 'Group ID', 'Content ID'];
    const rows = logs.map(l => [
      Tracker.formatDate(l.postedAt),
      l.contentTitle || '',
      l.groupName || '',
      (l.language || '').toUpperCase(),
      l.type || '',
      l.text || '',
      l.groupId || '',
      l.contentId || ''
    ]);
    download(buildCSV(headers, rows), `cods-history-${dateStr()}.csv`);
    return logs.length;
  }

  /* ── Export: Daily Plans ── */
  function exportPlans() {
    const plans = Store.getPlans();
    const headers = ['Plan Date', 'Session', 'Content Title', 'Group Name', 'Language', 'Type', 'Status', 'Post Text'];
    const rows = [];
    for (const plan of plans) {
      const items = [
        ...plan.morning.map(i => ({ ...i, session: 'Morning' })),
        ...plan.evening.map(i => ({ ...i, session: 'Evening' }))
      ];
      for (const item of items) {
        rows.push([
          plan.date,
          item.session,
          item.contentTitle || '',
          item.groupName || '',
          (item.language || '').toUpperCase(),
          item.type || '',
          item.done ? 'Posted' : 'Pending',
          item.text || ''
        ]);
      }
    }
    download(buildCSV(headers, rows), `cods-plans-${dateStr()}.csv`);
    return rows.length;
  }

  /* ── Export: Group List ── */
  function exportGroups() {
    const groups = Store.getGroups();
    const headers = ['Group Name', 'URL', 'Language', 'Category', 'Notes', 'Last Posted', 'Post Count', 'Added On'];
    const rows = groups.map(g => [
      g.name,
      g.url,
      (g.language || '').toUpperCase(),
      g.category || '',
      g.notes || '',
      g.lastPostedAt ? Tracker.formatDateShort(g.lastPostedAt) : 'Never',
      g.postCount || 0,
      Tracker.formatDateShort(g.addedAt)
    ]);
    download(buildCSV(headers, rows), `cods-groups-${dateStr()}.csv`);
    return groups.length;
  }

  /* ── Export: Content Library ── */
  function exportContent() {
    const content = Store.getContent();
    const headers = ['Title', 'Language', 'Type', 'Status', 'Original Text', 'Variation 1', 'Variation 2', 'Variation 3', 'EN Adaptation', 'ES Adaptation', 'NL Adaptation', 'Notes', 'Created On'];
    const rows = content.map(c => [
      c.title,
      (c.language || '').toUpperCase(),
      c.type || '',
      c.status || '',
      c.originalText || '',
      (c.variations || [])[0] || '',
      (c.variations || [])[1] || '',
      (c.variations || [])[2] || '',
      (c.translations || {}).en || '',
      (c.translations || {}).es || '',
      (c.translations || {}).nl || '',
      c.notes || '',
      Tracker.formatDateShort(c.createdAt)
    ]);
    download(buildCSV(headers, rows), `cods-content-${dateStr()}.csv`);
    return content.length;
  }

  /* ── Export: Full JSON Backup ── */
  function exportBackup() {
    const backup = {
      _meta: {
        app:       'Curacao Oasis Distribution System',
        version:   '1.0',
        exportedAt: new Date().toISOString(),
        counts: {
          content: Store.getContent().length,
          groups:  Store.getGroups().length,
          logs:    Store.getLogs().length,
          plans:   Store.getPlans().length
        }
      },
      content:  Store.getContent(),
      groups:   Store.getGroups(),
      logs:     Store.getLogs(),
      plans:    Store.getPlans(),
      settings: Store.getSettings()
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `cods-backup-${dateStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return backup._meta.counts;
  }

  /* ── Import: Full JSON Backup ── */
  function importBackup(file, onDone) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      let backup;
      try {
        backup = JSON.parse(e.target.result);
      } catch {
        App.toast('Invalid backup file — could not parse JSON.', 'error');
        return;
      }

      // Validate structure
      if (!backup._meta || !Array.isArray(backup.content) || !Array.isArray(backup.groups)) {
        App.toast('This file does not appear to be a valid CODS backup.', 'error');
        return;
      }

      const meta = backup._meta;
      const msg = [
        `Backup from: ${meta.exportedAt ? new Date(meta.exportedAt).toLocaleString() : 'unknown date'}`,
        `Content items: ${(backup.content || []).length}`,
        `Facebook groups: ${(backup.groups || []).length}`,
        `Posting history: ${(backup.logs || []).length} entries`,
        `Daily plans: ${(backup.plans || []).length}`,
        '',
        'This will REPLACE all current data in this browser.',
        'Are you sure you want to restore this backup?'
      ].join('\n');

      if (!confirm(msg)) return;

      // Write all data
      try {
        Store.saveContent(backup.content  || []);
        Store.saveGroups (backup.groups   || []);
        Store.clearLogs();
        (backup.logs || []).slice().reverse().forEach(l => Store.addLog(l));
        (backup.plans || []).forEach(p => Store.savePlan(p));
        if (backup.settings) Store.saveSettings(backup.settings);

        // Mark as seeded so sample data doesn't re-appear
        localStorage.setItem(Store.KEYS.SEEDED, 'true');

        App.toast(`Backup restored! ${backup.groups.length} groups, ${backup.content.length} content items loaded. Refreshing…`, 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        App.toast('Restore failed: ' + err.message, 'error');
      }

      if (typeof onDone === 'function') onDone();
    };

    reader.readAsText(file, 'UTF-8');
  }

  /* ── Trigger import via hidden file input ── */
  function triggerImportBackup() {
    // Create a temporary file input
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    input.onchange = () => {
      importBackup(input.files[0], () => document.body.removeChild(input));
    };
    document.body.appendChild(input);
    input.click();
  }

  return { exportHistory, exportPlans, exportGroups, exportContent, exportBackup, triggerImportBackup };
})();

