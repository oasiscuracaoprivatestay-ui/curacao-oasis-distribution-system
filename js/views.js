/* ============================================================
   VIEWS.JS — All view rendering (Part 1: Dashboard, Content)
   ============================================================ */
'use strict';

const Views = (() => {

  /* ── Shared helpers ── */
  function langBadge(lang) {
    return `<span class="badge badge-${lang}">${(lang||'').toUpperCase()}</span>`;
  }
  function typeBadge(type) {
    const icons = { video:'🎥', reel:'🎬', image:'🖼️', text:'📝' };
    return `<span class="badge badge-gray">${icons[type]||'📄'} ${type||''}</span>`;
  }
  function statusBadge(status) {
    return `<span class="badge badge-${status}">${status||'draft'}</span>`;
  }
  function catBadge(cat) {
    return `<span class="badge badge-orange" style="font-size:10px">${cat||''}</span>`;
  }
  function escHtml(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function truncate(str, n=100) {
    return str && str.length > n ? str.slice(0,n)+'…' : (str||'');
  }

  /* ════════════════════════════════════════
     DASHBOARD VIEW
     ════════════════════════════════════════ */
  function renderDashboard() {
    const stats   = Tracker.getOverallStats();
    const todayStr = Planner.today();
    const plan    = Store.getPlanForDate(todayStr);
    const flatPlan = plan ? Planner.getFlatPlan(plan) : [];
    const pending = flatPlan.filter(i => !i.done);
    const done    = flatPlan.filter(i => i.done);
    const progress = flatPlan.length > 0 ? Math.round((done.length / flatPlan.length) * 100) : 0;

    const date = new Date();
    const dayName = date.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });

    let planHtml = '';
    if (flatPlan.length === 0) {
      planHtml = `<div class="empty-state" style="padding:30px 0">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-title">No plan for today yet</div>
        <div class="empty-state-desc">Go to <strong>Daily Plan</strong> and generate today's posting schedule.</div>
        <button class="btn btn-primary" onclick="App.navigate('plan')">Generate Today's Plan</button>
      </div>`;
    } else {
      planHtml = flatPlan.slice(0,6).map(item => `
        <div class="plan-item${item.done?' done':''}">
          <div class="plan-item-num">${item.done ? '✅' : (item.session==='morning'?'🌅':'🌙')}</div>
          <div class="plan-item-body">
            <div class="plan-item-group">${escHtml(item.groupName)}</div>
            <div class="plan-item-content">${escHtml(truncate(item.contentTitle,60))} · ${(item.language||'').toUpperCase()}</div>
          </div>
          <div class="plan-item-actions">
            ${item.done
              ? `<span class="badge badge-ready">Posted</span>`
              : `<button class="btn btn-primary btn-sm" onclick="App.navigate('assistant')">Post</button>`
            }
          </div>
        </div>`).join('');
    }

    // Recent history (last 5)
    const recentLogs = Store.getLogs().slice(0,5);
    let historyHtml = recentLogs.length === 0
      ? `<p style="color:var(--text-muted);font-size:13px;padding:12px 0">No posts recorded yet.</p>`
      : recentLogs.map(l => `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-light)">
          <span style="font-size:18px">${{video:'🎥',reel:'🎬',image:'🖼️',text:'📝'}[l.type]||'📄'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${escHtml(truncate(l.groupName,40))}</div>
            <div style="font-size:12px;color:var(--text-muted)">${escHtml(truncate(l.contentTitle,40))} · ${Tracker.formatDateShort(l.postedAt)}</div>
          </div>
          ${langBadge(l.language)}
        </div>`).join('');

    const el = document.getElementById('view-dashboard');
    el.innerHTML = `
      <div class="dash-hero">
        <div>
          <div class="dash-hero-title">Good ${date.getHours()<12?'morning':date.getHours()<18?'afternoon':'evening'}! 👋</div>
          <div class="dash-hero-sub">${dayName} · Curacao Oasis Distribution System</div>
        </div>
        <div class="dash-hero-emoji">🌊</div>
      </div>

      <div class="grid-4" style="margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-icon orange">📝</div>
          <div class="stat-body">
            <div class="stat-value">${stats.totalContent}</div>
            <div class="stat-label">Content Items</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon teal">👥</div>
          <div class="stat-body">
            <div class="stat-value">${stats.totalGroups}</div>
            <div class="stat-label">Facebook Groups</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">✅</div>
          <div class="stat-body">
            <div class="stat-value">${stats.postsToday}</div>
            <div class="stat-label">Posted Today</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon sea">📜</div>
          <div class="stat-body">
            <div class="stat-value">${stats.totalPosts}</div>
            <div class="stat-label">All-Time Posts</div>
          </div>
        </div>
      </div>

      <div class="grid-2" style="align-items:start">
        <div>
          <div class="card">
            <div class="card-header">
              <span class="card-title">📅 Today's Plan</span>
              <div style="display:flex;align-items:center;gap:10px">
                ${flatPlan.length>0 ? `<span style="font-size:12px;color:var(--text-muted)">${done.length}/${flatPlan.length} done</span>` : ''}
                <button class="btn btn-ghost btn-sm" onclick="App.navigate('plan')">View All</button>
              </div>
            </div>
            ${flatPlan.length>0 ? `
            <div style="padding:14px 20px 8px">
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" style="width:${progress}%"></div>
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:5px">${progress}% complete</div>
            </div>` : ''}
            <div class="card-body" style="padding-top:${flatPlan.length>0?'8px':'20px'}">
              ${planHtml}
            </div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card-header">
              <span class="card-title">📜 Recent Posts</span>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('history')">View All</button>
            </div>
            <div class="card-body">${historyHtml}</div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">⚡ Quick Actions</span></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
              <button class="btn btn-primary btn-block" onclick="App.navigate('assistant')">✉️ Open Posting Assistant</button>
              <button class="btn btn-teal btn-block" onclick="App.navigate('plan')">📅 Generate Today's Plan</button>
              <button class="btn btn-ghost btn-block" onclick="App.navigate('content')">➕ Add New Content</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ════════════════════════════════════════
     CONTENT LIBRARY VIEW
     ════════════════════════════════════════ */
  function renderContent(filters = {}) {
    let items = Store.getContent();

    // Apply filters
    if (filters.lang)   items = items.filter(i => i.language === filters.lang);
    if (filters.type)   items = items.filter(i => i.type === filters.type);
    if (filters.status) items = items.filter(i => i.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(i =>
        (i.title||'').toLowerCase().includes(q) ||
        (i.originalText||'').toLowerCase().includes(q)
      );
    }

    const cardsHtml = items.length === 0
      ? `<div class="empty-state"><div class="empty-state-icon">📝</div>
          <div class="empty-state-title">No content found</div>
          <div class="empty-state-desc">Add your first content item or adjust your filters.</div>
          <button class="btn btn-primary" onclick="Views.showAddContentModal()">Add Content</button></div>`
      : `<div class="grid-3">${items.map(item => renderContentCard(item)).join('')}</div>`;

    const el = document.getElementById('view-content');
    el.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Content Library</h1>
          <div class="page-subtitle">${Store.getContent().length} items · ${Store.getContent().filter(c=>c.status==='ready').length} ready</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm" onclick="Exporter.exportContent();App.toast('Content library exported!','success')">⬇️ Export CSV</button>
          <button class="btn btn-primary" onclick="Views.showAddContentModal()">➕ Add Content</button>
        </div>
      </div>

      <div class="filter-bar">
        <input type="text" class="form-control search-input" id="contentSearch" placeholder="🔍 Search content…" value="${escHtml(filters.search||'')}" oninput="Views.renderContent({lang:document.getElementById('filterLang').value,type:document.getElementById('filterType').value,status:document.getElementById('filterStatus').value,search:this.value})">
        <select class="form-control" id="filterLang" onchange="Views.renderContent({lang:this.value,type:document.getElementById('filterType').value,status:document.getElementById('filterStatus').value,search:document.getElementById('contentSearch').value})">
          <option value="">All Languages</option>
          <option value="en" ${filters.lang==='en'?'selected':''}>🇬🇧 English</option>
          <option value="nl" ${filters.lang==='nl'?'selected':''}>🇳🇱 Dutch</option>
          <option value="es" ${filters.lang==='es'?'selected':''}>🇪🇸 Spanish</option>
        </select>
        <select class="form-control" id="filterType" onchange="Views.renderContent({lang:document.getElementById('filterLang').value,type:this.value,status:document.getElementById('filterStatus').value,search:document.getElementById('contentSearch').value})">
          <option value="">All Types</option>
          <option value="text" ${filters.type==='text'?'selected':''}>📝 Text</option>
          <option value="image" ${filters.type==='image'?'selected':''}>🖼️ Image</option>
          <option value="video" ${filters.type==='video'?'selected':''}>🎥 Video</option>
          <option value="reel" ${filters.type==='reel'?'selected':''}>🎬 Reel</option>
        </select>
        <select class="form-control" id="filterStatus" onchange="Views.renderContent({lang:document.getElementById('filterLang').value,type:document.getElementById('filterType').value,status:this.value,search:document.getElementById('contentSearch').value})">
          <option value="">All Status</option>
          <option value="draft" ${filters.status==='draft'?'selected':''}>Draft</option>
          <option value="ready" ${filters.status==='ready'?'selected':''}>Ready</option>
          <option value="used" ${filters.status==='used'?'selected':''}>Used</option>
        </select>
      </div>
      ${cardsHtml}`;
  }

  function renderContentCard(item) {
    const varCount = (item.variations||[]).length;
    const transCount = Object.keys(item.translations||{}).filter(k => item.translations[k]).length;
    return `
      <div class="content-card">
        <div class="content-card-header">
          <div class="content-card-title">${escHtml(item.title)}</div>
          ${statusBadge(item.status)}
        </div>
        <div class="content-card-body">
          <div class="content-card-text">${escHtml(truncate(item.originalText,160))}</div>
          <div class="tag-row" style="margin-top:10px">
            ${langBadge(item.language)} ${typeBadge(item.type)}
            ${varCount > 0 ? `<span class="badge badge-teal">🔄 ${varCount} variations</span>` : ''}
            ${transCount > 0 ? `<span class="badge badge-orange">🌍 ${transCount} lang</span>` : ''}
          </div>
        </div>
        <div class="content-card-footer">
          <button class="btn btn-ghost btn-sm" onclick="Views.showContentDetail('${item.id}')">View</button>
          <button class="btn btn-sea btn-sm" onclick="Views.generateVariationsForItem('${item.id}')">🔄 Variations</button>
          <button class="btn btn-teal btn-sm" onclick="Views.adaptLanguagesForItem('${item.id}')">🌍 Adapt</button>
          <button class="btn btn-ghost btn-sm" onclick="Views.showEditContentModal('${item.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="Views.deleteContent('${item.id}')">🗑️</button>
        </div>
      </div>`;
  }

  function showContentDetail(id) {
    const item = Store.getContentById(id);
    if (!item) return;
    const vars = (item.variations||[]);
    const trans = item.translations||{};
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalBody').innerHTML = `
      <div style="margin-bottom:16px">
        <div class="tag-row">${langBadge(item.language)} ${typeBadge(item.type)} ${statusBadge(item.status)}</div>
      </div>

      <div class="section-label">Original Text</div>
      <div class="posting-text-box">${escHtml(item.originalText)}</div>
      <button class="btn btn-ghost btn-sm" style="margin-top:-8px;margin-bottom:12px" onclick="App.copyText(${JSON.stringify(item.originalText)})">📋 Copy Original</button>

      ${vars.length > 0 ? `
        <div class="section-label">Variations (${vars.length})</div>
        ${vars.map((v,i) => `
          <div class="variation-block">
            <div class="variation-block-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
              <span class="variation-block-title">Variation ${i+1}</span>
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();App.copyText(${JSON.stringify(v)})">📋 Copy</button>
            </div>
            <div class="variation-block-body" style="display:none">${escHtml(v)}</div>
          </div>`).join('')}` : ''}

      ${Object.keys(trans).some(k=>trans[k]) ? `
        <div class="section-label">Language Adaptations</div>
        ${['en','es','nl'].filter(l=>trans[l]).map(l => `
          <div class="variation-block">
            <div class="variation-block-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
              <span class="variation-block-title">${{en:'🇬🇧 English',es:'🇪🇸 Spanish',nl:'🇳🇱 Dutch'}[l]}</span>
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();App.copyText(${JSON.stringify(trans[l])})">📋 Copy</button>
            </div>
            <div class="variation-block-body" style="display:none">${escHtml(trans[l])}</div>
          </div>`).join('')}` : ''}

      <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-sea" onclick="Views.generateVariationsForItem('${id}')">🔄 Regenerate Variations</button>
        <button class="btn btn-teal" onclick="Views.adaptLanguagesForItem('${id}')">🌍 Adapt Languages</button>
        <button class="btn btn-ghost" onclick="Views.showEditContentModal('${id}')">✏️ Edit</button>
      </div>`;
    App.openModal();
  }

  function showAddContentModal() {
    document.getElementById('modalTitle').textContent = 'Add New Content';
    document.getElementById('modalBody').innerHTML = `
      <form id="addContentForm">
        <div class="form-group">
          <label class="form-label">Title <span class="req">*</span></label>
          <input type="text" class="form-control" id="cTitle" placeholder="e.g. Sea View Apartment - EN" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Language <span class="req">*</span></label>
            <select class="form-control" id="cLang" required>
              <option value="en">🇬🇧 English</option>
              <option value="nl">🇳🇱 Dutch</option>
              <option value="es">🇪🇸 Spanish</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Content Type <span class="req">*</span></label>
            <select class="form-control" id="cType" required>
              <option value="text">📝 Text Post</option>
              <option value="image">🖼️ Image Caption</option>
              <option value="reel">🎬 Reel Description</option>
              <option value="video">🎥 Video Post</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="cStatus">
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Post Text <span class="req">*</span></label>
          <textarea class="form-control" id="cText" rows="7" placeholder="Paste your Facebook post here. Include your WhatsApp CTA." required></textarea>
          <div class="form-hint">Include your WhatsApp booking link/number — it will be preserved in all variations.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <input type="text" class="form-control" id="cNotes" placeholder="Any notes for this content item">
        </div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button type="submit" class="btn btn-primary">Save Content</button>
          <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        </div>
      </form>`;
    document.getElementById('addContentForm').addEventListener('submit', e => {
      e.preventDefault();
      const item = Store.createContent({
        title: document.getElementById('cTitle').value.trim(),
        originalText: document.getElementById('cText').value.trim(),
        language: document.getElementById('cLang').value,
        type: document.getElementById('cType').value,
        status: document.getElementById('cStatus').value,
        notes: document.getElementById('cNotes').value.trim()
      });
      Store.addContent(item);
      App.closeModal();
      renderContent();
      App.toast('Content added successfully!', 'success');
    });
    App.openModal();
  }

  function showEditContentModal(id) {
    const item = Store.getContentById(id);
    if (!item) return;
    document.getElementById('modalTitle').textContent = 'Edit Content';
    document.getElementById('modalBody').innerHTML = `
      <form id="editContentForm">
        <div class="form-group">
          <label class="form-label">Title</label>
          <input type="text" class="form-control" id="ecTitle" value="${escHtml(item.title)}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Language</label>
            <select class="form-control" id="ecLang">
              <option value="en" ${item.language==='en'?'selected':''}>🇬🇧 English</option>
              <option value="nl" ${item.language==='nl'?'selected':''}>🇳🇱 Dutch</option>
              <option value="es" ${item.language==='es'?'selected':''}>🇪🇸 Spanish</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-control" id="ecType">
              <option value="text" ${item.type==='text'?'selected':''}>📝 Text</option>
              <option value="image" ${item.type==='image'?'selected':''}>🖼️ Image</option>
              <option value="reel" ${item.type==='reel'?'selected':''}>🎬 Reel</option>
              <option value="video" ${item.type==='video'?'selected':''}>🎥 Video</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="ecStatus">
            <option value="draft" ${item.status==='draft'?'selected':''}>Draft</option>
            <option value="ready" ${item.status==='ready'?'selected':''}>Ready</option>
            <option value="used"  ${item.status==='used'?'selected':''}>Used</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Post Text</label>
          <textarea class="form-control" id="ecText" rows="7">${escHtml(item.originalText)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <input type="text" class="form-control" id="ecNotes" value="${escHtml(item.notes||'')}">
        </div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button type="submit" class="btn btn-primary">Save Changes</button>
          <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        </div>
      </form>`;
    document.getElementById('editContentForm').addEventListener('submit', e => {
      e.preventDefault();
      Store.updateContent(id, {
        title: document.getElementById('ecTitle').value.trim(),
        originalText: document.getElementById('ecText').value.trim(),
        language: document.getElementById('ecLang').value,
        type: document.getElementById('ecType').value,
        status: document.getElementById('ecStatus').value,
        notes: document.getElementById('ecNotes').value.trim()
      });
      App.closeModal();
      renderContent();
      App.toast('Content updated!', 'success');
    });
    App.openModal();
  }

  function generateVariationsForItem(id) {
    const item = Store.getContentById(id);
    if (!item) return;
    App.toast('Generating variations…', 'info');
    setTimeout(() => {
      const vars = Engine.generateVariations(item.originalText, item.language, 3);
      Store.updateContent(id, { variations: vars });
      App.toast(`${vars.length} variations generated!`, 'success');
      renderContent();
    }, 400);
  }

  function adaptLanguagesForItem(id) {
    const item = Store.getContentById(id);
    if (!item) return;
    App.toast('Adapting to all languages…', 'info');
    setTimeout(() => {
      const translations = {
        en: Engine.adaptToLanguage(item.originalText, 'en'),
        es: Engine.adaptToLanguage(item.originalText, 'es'),
        nl: Engine.adaptToLanguage(item.originalText, 'nl')
      };
      Store.updateContent(id, { translations });
      App.toast('All 3 language adaptations ready!', 'success');
      renderContent();
    }, 500);
  }

  function deleteContent(id) {
    if (!confirm('Delete this content item? This cannot be undone.')) return;
    Store.deleteContent(id);
    renderContent();
    App.toast('Content deleted.', 'info');
  }

  return {
    renderDashboard, renderContent, renderContentCard,
    showContentDetail, showAddContentModal, showEditContentModal,
    generateVariationsForItem, adaptLanguagesForItem, deleteContent
  };
})();

/* ════════════════════════════════════════
   GROUPS VIEW
   ════════════════════════════════════════ */
Views.renderGroups = function(filters = {}) {
  let groups = Store.getGroups();
  if (filters.lang) groups = groups.filter(g => g.language === filters.lang);
  if (filters.cat)  groups = groups.filter(g => g.category === filters.cat);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    groups = groups.filter(g => (g.name||'').toLowerCase().includes(q) || (g.notes||'').toLowerCase().includes(q));
  }

  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function langBadge(l){ return `<span class="badge badge-${l}">${(l||'').toUpperCase()}</span>`; }
  function catBadge(c){ return `<span class="badge badge-orange" style="font-size:10px">${c||''}</span>`; }

  const cardsHtml = groups.length === 0
    ? `<div class="empty-state"><div class="empty-state-icon">👥</div>
        <div class="empty-state-title">No groups found</div>
        <div class="empty-state-desc">Add your Facebook groups to start planning posts.</div>
        <button class="btn btn-primary" onclick="Views.showAddGroupModal()">Add Group</button></div>`
    : `<div class="grid-3">${groups.map(g => Views.renderGroupCard(g)).join('')}</div>`;

  const allGroups = Store.getGroups();
  const sampleCount = allGroups.filter(g => g.source === 'sample').length;
  const importedCount = allGroups.filter(g => g.source === 'imported').length;

  document.getElementById('view-groups').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Facebook Groups</h1>
        <div class="page-subtitle">${Store.getGroups().length} groups total${sampleCount > 0 ? ` &middot; <span style="color:var(--text-muted);font-size:12px">${sampleCount} sample</span>` : ''}${importedCount > 0 ? ` &middot; <span style="color:var(--brand-teal);font-size:12px">${importedCount} imported</span>` : ''}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-ghost btn-sm" onclick="Exporter.exportGroups();App.toast('Groups exported!','success')">⬇️ Export CSV</button>
        <button class="btn btn-sea btn-sm" onclick="Importer.showImportModal()">⬆️ Import Groups</button>
        <button class="btn btn-primary" onclick="Views.showAddGroupModal()">➕ Add Group</button>
      </div>
    </div>
    <div class="filter-bar">
      <input type="text" class="form-control search-input" placeholder="🔍 Search groups…" value="${escHtml(filters.search||'')}"
        oninput="Views.renderGroups({lang:document.getElementById('gfLang').value,cat:document.getElementById('gfCat').value,search:this.value})">
      <select class="form-control" id="gfLang" onchange="Views.renderGroups({lang:this.value,cat:document.getElementById('gfCat').value})">
        <option value="">All Languages</option>
        <option value="en" ${filters.lang==='en'?'selected':''}>🇬🇧 English</option>
        <option value="nl" ${filters.lang==='nl'?'selected':''}>🇳🇱 Dutch</option>
        <option value="es" ${filters.lang==='es'?'selected':''}>🇪🇸 Spanish</option>
      </select>
      <select class="form-control" id="gfCat" onchange="Views.renderGroups({lang:document.getElementById('gfLang').value,cat:this.value})">
        <option value="">All Categories</option>
        <option value="vacation rental">Vacation Rental</option>
        <option value="real estate">Real Estate</option>
        <option value="marketplace">Marketplace</option>
        <option value="expat">Expat</option>
        <option value="general">General</option>
      </select>
    </div>
    ${cardsHtml}`;
};

Views.renderGroupCard = function(g) {
  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function langBadge(l){ return `<span class="badge badge-${l}">${(l||'').toUpperCase()}</span>`; }
  function catBadge(c){ return `<span class="badge badge-orange" style="font-size:10px">${c||''}</span>`; }
  const lastPosted = g.lastPostedAt ? Tracker.formatDateShort(g.lastPostedAt) : 'Never';
  return `
    <div class="group-card">
      <div class="group-card-header">
        <div>
          <div class="group-card-name">${escHtml(g.name)}</div>
          <a class="group-card-url" href="${escHtml(g.url)}" target="_blank" rel="noopener">${escHtml(g.url)}</a>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end">
          ${langBadge(g.language)} ${catBadge(g.category)}
        </div>
      </div>
      <div class="group-card-body">
        ${g.notes ? `<div class="group-meta">📌 ${escHtml(g.notes)}</div>` : ''}
        <div class="group-meta" style="margin-top:6px">🕐 Last posted: <strong>${lastPosted}</strong> · ${g.postCount||0} posts</div>
      </div>
      <div class="group-card-footer">
        <a class="btn btn-sea btn-sm" href="${escHtml(g.url)}" target="_blank" rel="noopener">🔗 Open Group</a>
        <button class="btn btn-ghost btn-sm" onclick="Views.showEditGroupModal('${g.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="Views.deleteGroup('${g.id}')">🗑️</button>
        ${g.source === 'sample'   ? '<span class="badge badge-gray" style="font-size:10px;margin-left:auto">sample</span>'    : ''}
        ${g.source === 'imported' ? '<span class="badge badge-teal" style="font-size:10px;margin-left:auto">imported</span>'  : ''}
      </div>
    </div>`;
};

Views.showAddGroupModal = function() {
  document.getElementById('modalTitle').textContent = 'Add Facebook Group';
  document.getElementById('modalBody').innerHTML = `
    <form id="addGroupForm">
      <div class="form-group">
        <label class="form-label">Group Name <span class="req">*</span></label>
        <input type="text" class="form-control" id="gName" placeholder="e.g. Curacao Vacation Rentals" required>
      </div>
      <div class="form-group">
        <label class="form-label">Facebook Group URL <span class="req">*</span></label>
        <input type="url" class="form-control" id="gUrl" placeholder="https://www.facebook.com/groups/…" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Language <span class="req">*</span></label>
          <select class="form-control" id="gLang" required>
            <option value="en">🇬🇧 English</option>
            <option value="nl">🇳🇱 Dutch</option>
            <option value="es">🇪🇸 Spanish</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Category <span class="req">*</span></label>
          <select class="form-control" id="gCat" required>
            <option value="vacation rental">Vacation Rental</option>
            <option value="real estate">Real Estate</option>
            <option value="marketplace">Marketplace</option>
            <option value="expat">Expat</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes (optional)</label>
        <input type="text" class="form-control" id="gNotes" placeholder="e.g. Active daily, post max 3x/week">
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button type="submit" class="btn btn-primary">Save Group</button>
        <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      </div>
    </form>`;
  document.getElementById('addGroupForm').addEventListener('submit', e => {
    e.preventDefault();
    Store.addGroup(Store.createGroup({
      name: document.getElementById('gName').value.trim(),
      url:  document.getElementById('gUrl').value.trim(),
      language: document.getElementById('gLang').value,
      category: document.getElementById('gCat').value,
      notes: document.getElementById('gNotes').value.trim()
    }));
    App.closeModal();
    Views.renderGroups();
    App.toast('Group added!', 'success');
  });
  App.openModal();
};

Views.showEditGroupModal = function(id) {
  const g = Store.getGroupById(id);
  if (!g) return;
  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  document.getElementById('modalTitle').textContent = 'Edit Group';
  document.getElementById('modalBody').innerHTML = `
    <form id="editGroupForm">
      <div class="form-group">
        <label class="form-label">Group Name</label>
        <input type="text" class="form-control" id="egName" value="${escHtml(g.name)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Facebook Group URL</label>
        <input type="url" class="form-control" id="egUrl" value="${escHtml(g.url)}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Language</label>
          <select class="form-control" id="egLang">
            <option value="en" ${g.language==='en'?'selected':''}>🇬🇧 English</option>
            <option value="nl" ${g.language==='nl'?'selected':''}>🇳🇱 Dutch</option>
            <option value="es" ${g.language==='es'?'selected':''}>🇪🇸 Spanish</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-control" id="egCat">
            <option value="vacation rental" ${g.category==='vacation rental'?'selected':''}>Vacation Rental</option>
            <option value="real estate"     ${g.category==='real estate'?'selected':''}>Real Estate</option>
            <option value="marketplace"     ${g.category==='marketplace'?'selected':''}>Marketplace</option>
            <option value="expat"           ${g.category==='expat'?'selected':''}>Expat</option>
            <option value="general"         ${g.category==='general'?'selected':''}>General</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <input type="text" class="form-control" id="egNotes" value="${escHtml(g.notes||'')}">
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button type="submit" class="btn btn-primary">Save Changes</button>
        <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      </div>
    </form>`;
  document.getElementById('editGroupForm').addEventListener('submit', e => {
    e.preventDefault();
    Store.updateGroup(id, {
      name: document.getElementById('egName').value.trim(),
      url:  document.getElementById('egUrl').value.trim(),
      language: document.getElementById('egLang').value,
      category: document.getElementById('egCat').value,
      notes: document.getElementById('egNotes').value.trim()
    });
    App.closeModal();
    Views.renderGroups();
    App.toast('Group updated!', 'success');
  });
  App.openModal();
};

Views.deleteGroup = function(id) {
  if (!confirm('Delete this group? This cannot be undone.')) return;
  Store.deleteGroup(id);
  Views.renderGroups();
  App.toast('Group deleted.', 'info');
};

/* ════════════════════════════════════════
   DAILY PLAN VIEW
   ════════════════════════════════════════ */
Views.renderPlan = function() {
  const todayStr = Planner.today();
  const plan = Store.getPlanForDate(todayStr);
  const flat = plan ? Planner.getFlatPlan(plan) : [];
  const done = flat.filter(i => i.done).length;

  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function langBadge(l){ return `<span class="badge badge-${l}">${(l||'').toUpperCase()}</span>`; }
  function typeBadge(t){ const ic={video:'🎥',reel:'🎬',image:'🖼️',text:'📝'}; return `<span class="badge badge-gray">${ic[t]||'📄'} ${t||''}</span>`; }

  function renderSession(items, session) {
    if (!items || items.length === 0) return `<div style="color:var(--text-muted);font-size:13px;padding:8px 0">No posts scheduled for this session.</div>`;
    return items.map((item, idx) => `
      <div class="plan-item${item.done?' done':''}" id="pi-${session}-${idx}">
        <div class="plan-item-num">${item.done ? '✅' : (idx+1)}</div>
        <div class="plan-item-body">
          <div class="plan-item-group">${escHtml(item.groupName)}</div>
          <div class="plan-item-content">${escHtml(item.contentTitle)} · ${langBadge(item.language)} ${typeBadge(item.type)}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${escHtml((item.text||'').slice(0,80))}…</div>
        </div>
        <div class="plan-item-actions">
          ${item.done
            ? `<span class="badge badge-ready">Posted ✓</span>`
            : `<button class="btn btn-primary btn-sm" onclick="App.navigate('assistant')">✉️ Post</button>
               <button class="btn btn-success btn-sm" onclick="Views.markDone('${todayStr}','${session}',${idx})">✅ Done</button>`
          }
        </div>
      </div>`).join('');
  }

  const hasPlan = plan && (plan.morning.length > 0 || plan.evening.length > 0);
  const progressPct = flat.length > 0 ? Math.round(done/flat.length*100) : 0;

  document.getElementById('view-plan').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Daily Plan</h1>
        <div class="page-subtitle">${todayStr} · ${flat.length} posts planned · ${done} completed</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-ghost btn-sm" onclick="Exporter.exportPlans();App.toast('Plans exported!','success')">⬇️ Export CSV</button>
        <button class="btn btn-primary" onclick="Views.generatePlanNow()">📅 Generate Today's Plan</button>
      </div>
    </div>

    ${hasPlan ? `
    <div class="card" style="margin-bottom:20px;padding:18px 20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span style="font-size:14px;font-weight:600">Today's Progress</span>
        <span style="font-size:13px;color:var(--text-muted)">${done} of ${flat.length} posted</span>
      </div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${progressPct}%"></div></div>
    </div>` : ''}

    ${!hasPlan ? `
    <div class="empty-state">
      <div class="empty-state-icon">📅</div>
      <div class="empty-state-title">No plan for today</div>
      <div class="empty-state-desc">Generate a plan and the system will match your ready content to the best Facebook groups for today.</div>
      <button class="btn btn-primary btn-lg" onclick="Views.generatePlanNow()">📅 Generate Today's Plan</button>
    </div>` : `
    <div class="alert alert-info">📌 This is a <strong>manual posting plan</strong>. Click <strong>Post</strong> to open the Posting Assistant, or <strong>Done</strong> to mark directly.</div>

    <div class="plan-session">
      <div class="session-header">
        <span style="font-size:22px">🌅</span>
        <span class="session-label">Morning Session</span>
        <div class="session-divider"></div>
        <span class="session-count">${(plan.morning||[]).length} posts</span>
      </div>
      ${renderSession(plan.morning, 'morning')}
    </div>

    <div class="plan-session">
      <div class="session-header">
        <span style="font-size:22px">🌙</span>
        <span class="session-label">Evening Session</span>
        <div class="session-divider"></div>
        <span class="session-count">${(plan.evening||[]).length} posts</span>
      </div>
      ${renderSession(plan.evening, 'evening')}
    </div>
    `}`;
};

Views.generatePlanNow = function() {
  const ready = Store.getContent().filter(c => c.status === 'ready');
  const groups = Store.getGroups();
  if (ready.length === 0) { App.toast('No ready content. Mark some content as Ready first.', 'warning'); return; }
  if (groups.length === 0) { App.toast('No groups added. Add Facebook groups first.', 'warning'); return; }
  App.toast('Generating plan…', 'info');
  setTimeout(() => {
    const plan = Planner.generatePlan();
    const total = (plan.morning||[]).length + (plan.evening||[]).length;
    if (total === 0) {
      App.toast('No matching content/group pairs found. Check languages match.', 'warning');
    } else {
      App.toast(`Plan generated! ${total} posts scheduled.`, 'success');
    }
    Views.renderPlan();
  }, 300);
};

Views.markDone = function(date, session, index) {
  Planner.markItemDone(date, session, index);
  Views.renderPlan();
  App.toast('Marked as posted! ✅', 'success');
};

/* ════════════════════════════════════════
   POSTING ASSISTANT VIEW
   ════════════════════════════════════════ */
Views.renderAssistant = function() {
  const todayStr = Planner.today();
  const plan = Store.getPlanForDate(todayStr);
  const flat = plan ? Planner.getFlatPlan(plan) : [];
  const pending = flat.filter(i => !i.done);
  const done    = flat.filter(i =>  i.done);

  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function langBadge(l){ return `<span class="badge badge-${l}">${(l||'').toUpperCase()}</span>`; }
  function typeBadge(t){ const ic={video:'🎥',reel:'🎬',image:'🖼️',text:'📝'}; return `<span class="badge badge-gray">${ic[t]||'📄'} ${t||''}</span>`; }

  const el = document.getElementById('view-assistant');

  if (flat.length === 0) {
    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Posting Assistant</h1>
        <div class="page-subtitle">Step-by-step manual posting workflow</div></div>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">✉️</div>
        <div class="empty-state-title">No plan for today</div>
        <div class="empty-state-desc">Generate a daily plan first — then come back here to post step by step.</div>
        <button class="btn btn-primary btn-lg" onclick="Views.generatePlanNow();App.navigate('assistant')">📅 Generate Plan First</button>
      </div>`;
    return;
  }

  if (pending.length === 0) {
    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Posting Assistant</h1></div>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <div class="empty-state-title">All done for today!</div>
        <div class="empty-state-desc">You've completed all ${done.length} posts in today's plan. Great work!</div>
        <button class="btn btn-ghost" onclick="App.navigate('history')">📜 View History</button>
      </div>`;
    return;
  }

  const current = pending[0];
  const totalDone = done.length;
  const total = flat.length;
  const pct = Math.round(totalDone/total*100);

  el.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Posting Assistant</h1>
      <div class="page-subtitle">${totalDone} of ${total} posts completed today</div></div>
      <div class="page-actions">
        <button class="btn btn-ghost btn-sm" onclick="App.navigate('plan')">📅 View Full Plan</button>
      </div>
    </div>

    <div style="max-width:680px;margin:0 auto">
      <div style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted);margin-bottom:6px">
          <span>Progress</span><span>${pct}%</span>
        </div>
        <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>

      <div class="posting-step">
        <div class="posting-step-header">
          <div>
            <div class="posting-step-progress">Post ${totalDone+1} of ${total} · ${current.session==='morning'?'🌅 Morning':'🌙 Evening'} Session</div>
            <div class="posting-step-num">${escHtml(current.groupName)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            ${langBadge(current.language)} ${typeBadge(current.type)}
          </div>
        </div>
        <div class="posting-step-body">
          <div class="posting-step-url">🔗 <a href="${escHtml(current.groupUrl)}" target="_blank" rel="noopener">${escHtml(current.groupUrl)}</a></div>

          <div style="margin:14px 0 6px;font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">Suggested Post Text</div>
          <div class="posting-text-box" id="postingTextBox">${escHtml(current.text)}</div>

          <div class="posting-actions">
            <button class="btn btn-primary" id="copyBtn" onclick="Views.copyPostText()">📋 Copy Text</button>
            <a class="btn btn-sea" href="${escHtml(current.groupUrl)}" target="_blank" rel="noopener">🔗 Open Group</a>
            <button class="btn btn-success" onclick="Views.markCurrentDone()">✅ Mark as Posted</button>
            <button class="btn btn-ghost" onclick="Views.skipCurrent()">⏭ Skip</button>
          </div>

          <div class="alert alert-info" style="margin-top:16px">
            <span>💡 <strong>Manual step:</strong> Copy the text → Open the group → Paste and post manually → Come back and click <strong>Mark as Posted</strong>.</span>
          </div>
        </div>
      </div>

      ${pending.length > 1 ? `
      <div style="margin-top:24px">
        <div class="section-label">Up Next</div>
        ${pending.slice(1,4).map((item,i) => `
          <div class="plan-item">
            <div class="plan-item-num">${i+2}</div>
            <div class="plan-item-body">
              <div class="plan-item-group">${escHtml(item.groupName)}</div>
              <div class="plan-item-content">${escHtml(item.contentTitle)} · ${(item.language||'').toUpperCase()}</div>
            </div>
            <div class="plan-item-actions">${langBadge(item.language)}</div>
          </div>`).join('')}
      </div>` : ''}
    </div>`;

  // Store current item reference for actions
  Views._currentPlanItem = current;
};

Views.copyPostText = function() {
  const item = Views._currentPlanItem;
  if (!item) return;
  App.copyText(item.text);
};

Views.markCurrentDone = function() {
  const item = Views._currentPlanItem;
  if (!item) return;
  Planner.markItemDone(Planner.today(), item.session, item.index);
  App.toast('Post marked as done! ✅', 'success');
  Views.renderAssistant();
};

Views.skipCurrent = function() {
  App.toast('Skipped. Moving to next post.', 'info');
  const item = Views._currentPlanItem;
  if (!item) return;
  // Move this item to the back by temporarily marking done then unmarking
  const plan = Store.getPlanForDate(Planner.today());
  if (plan) {
    const arr = plan[item.session];
    const [skipped] = arr.splice(item.index, 1);
    arr.push(skipped);
    Store.savePlan(plan);
  }
  Views.renderAssistant();
};

/* ════════════════════════════════════════
   HISTORY VIEW
   ════════════════════════════════════════ */
Views.renderHistory = function(filters = {}) {
  const logs = Tracker.getFilteredLogs(filters);

  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function langBadge(l){ return `<span class="badge badge-${l}">${(l||'').toUpperCase()}</span>`; }
  function typeBadge(t){ const ic={video:'🎥',reel:'🎬',image:'🖼️',text:'📝'}; return `<span class="badge badge-gray">${ic[t]||'📄'} ${t||''}</span>`; }

  const rowsHtml = logs.length === 0
    ? `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No posts recorded yet. Use the Posting Assistant to log your manual posts.</td></tr>`
    : logs.map(l => `
      <tr>
        <td>${Tracker.formatDate(l.postedAt)}</td>
        <td><strong>${escHtml(l.contentTitle||'—')}</strong></td>
        <td><a href="#" style="color:var(--brand-sea)">${escHtml(l.groupName||'—')}</a></td>
        <td>${langBadge(l.language)} ${typeBadge(l.type)}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml((l.text||'').slice(0,80))}…</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="App.copyText(${JSON.stringify(l.text||'')})">📋</button>
        </td>
      </tr>`).join('');

  document.getElementById('view-history').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Posting History</h1>
        <div class="page-subtitle">${Store.getLogs().length} posts recorded</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-danger btn-sm" onclick="Views.clearHistory()">🗑️ Clear All</button>
        <button class="btn btn-ghost btn-sm" onclick="Exporter.exportHistory();App.toast('History exported!','success')">⬇️ Export CSV</button>
      </div>
    </div>

    <div class="filter-bar">
      <input type="text" class="form-control search-input" placeholder="🔍 Search…" value="${escHtml(filters.search||'')}"
        oninput="Views.renderHistory({search:this.value,lang:document.getElementById('hfLang').value})">
      <select class="form-control" id="hfLang" onchange="Views.renderHistory({lang:this.value,search:document.querySelector('#view-history .search-input')?.value||''})">
        <option value="">All Languages</option>
        <option value="en" ${filters.lang==='en'?'selected':''}>🇬🇧 English</option>
        <option value="nl" ${filters.lang==='nl'?'selected':''}>🇳🇱 Dutch</option>
        <option value="es" ${filters.lang==='es'?'selected':''}>🇪🇸 Spanish</option>
      </select>
      <input type="date" class="form-control" placeholder="From date" value="${filters.dateFrom||''}"
        onchange="Views.renderHistory({dateFrom:this.value,lang:document.getElementById('hfLang').value})">
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date Posted</th>
            <th>Content</th>
            <th>Group</th>
            <th>Lang / Type</th>
            <th>Post Preview</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
};

Views.clearHistory = function() {
  if (!confirm('Clear all posting history? This cannot be undone.')) return;
  Store.clearLogs();
  Views.renderHistory();
  App.toast('History cleared.', 'info');
};

/* ════════════════════════════════════════
   SETTINGS VIEW
   ════════════════════════════════════════ */
Views.renderSettings = function() {
  const settings = Store.getSettings();
  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  document.getElementById('view-settings').innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Settings</h1>
      <div class="page-subtitle">Configure your distribution system preferences</div></div>
    </div>

    <div class="settings-section">
      <h3>🤖 AI Variation Engine</h3>
      <div class="alert alert-info">The variation engine currently runs <strong>fully offline</strong> using the built-in rule-based rewriter. You can optionally connect OpenAI GPT for higher-quality rewrites by entering your API key below.</div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Engine Mode</div>
          <div class="settings-row-desc">Rule-based (offline) is active and ready. GPT mode is optional.</div>
        </div>
        <span class="badge badge-ready" style="font-size:12px">✅ Offline Mode Active</span>
      </div>
      <div class="form-group" style="margin-top:16px">
        <label class="form-label">OpenAI API Key (optional — GPT placeholder)</label>
        <input type="password" class="form-control" id="gptKey" placeholder="sk-…" value="${escHtml(settings.gptApiKey||'')}">
        <div class="form-hint">Your key is stored locally in your browser only. Never shared externally. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" style="color:var(--brand-sea)">Get a key →</a></div>
      </div>
      <div class="alert alert-warning" style="margin-top:8px">
        ⚠️ GPT integration is a <strong>placeholder</strong>. To activate: open <code>js/engine.js</code>, find the <code>generateVariationsGPT</code> function, and follow the instructions in the comments.
      </div>
      <button class="btn btn-primary btn-sm" onclick="Views.saveGptKey()">Save API Key</button>
    </div>

    <div class="settings-section">
      <h3>📅 Planning Preferences</h3>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Group Cooldown Period</div>
          <div class="settings-row-desc">Minimum days before reposting to the same group (currently: 3 days).</div>
        </div>
        <span class="badge badge-orange">3 days</span>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Posts Per Session</div>
          <div class="settings-row-desc">Morning: up to 3 posts. Evening: up to 3 posts. Total: up to 6/day.</div>
        </div>
        <span class="badge badge-teal">6 per day</span>
      </div>
    </div>

    <div class="settings-section">
      <h3>📤 CSV Export</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button class="btn btn-ghost" onclick="Exporter.exportContent();App.toast('Content library exported!','success')">⬇️ Export Content Library</button>
        <button class="btn btn-ghost" onclick="Exporter.exportGroups();App.toast('Groups exported!','success')">⬇️ Export Group List</button>
        <button class="btn btn-ghost" onclick="Exporter.exportPlans();App.toast('Plans exported!','success')">⬇️ Export Daily Plans</button>
        <button class="btn btn-ghost" onclick="Exporter.exportHistory();App.toast('History exported!','success')">⬇️ Export Posting History</button>
      </div>
    </div>

    <div class="settings-section">
      <h3>⚠️ Data Management</h3>
      <div class="alert alert-warning">All data is stored in your browser's localStorage. It is never sent to any server.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-danger btn-sm" onclick="Views.resetAllData()">🗑️ Reset All Data</button>
      </div>
    </div>

    <div class="settings-section" style="background:var(--brand-orange-lt);border-color:var(--brand-orange)">
      <h3>ℹ️ About Curacao Oasis Distribution System</h3>
      <p style="font-size:13.5px;color:var(--text-secondary);line-height:1.7">
        A <strong>human-assisted</strong> manual posting system for Facebook group marketing.<br>
        <strong>No auto-posting. No bots. No Facebook API. No scraping.</strong><br>
        This tool helps you prepare, plan, copy, and track posts only.<br><br>
        Version 1.0 · Built for Curacao Oasis Vacation Rentals
      </p>
    </div>`;
};

Views.saveGptKey = function() {
  const key = document.getElementById('gptKey').value.trim();
  Store.saveSettings({ gptApiKey: key });
  App.toast('API key saved locally.', 'success');
};

Views.resetAllData = function() {
  if (!confirm('This will delete ALL content, groups, plans, and history. Are you absolutely sure?')) return;
  if (!confirm('Last chance — this cannot be undone. Reset everything?')) return;
  ['cods_content','cods_groups','cods_logs','cods_plans','cods_settings','cods_seeded_v1'].forEach(k => localStorage.removeItem(k));
  App.toast('All data reset. Reloading…', 'info');
  setTimeout(() => location.reload(), 1200);
};
