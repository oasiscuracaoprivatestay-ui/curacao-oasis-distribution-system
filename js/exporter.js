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

  return { exportHistory, exportPlans, exportGroups, exportContent };
})();
