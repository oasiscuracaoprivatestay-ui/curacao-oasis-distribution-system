/* ============================================================
   APP.JS — Router, Navigation, Events, Init
   ============================================================ */
'use strict';

const App = (() => {

  /* ── Current view ── */
  let _currentView = 'dashboard';

  /* ── Navigate to a view ── */
  function navigate(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target view
    const viewEl = document.getElementById(`view-${viewId}`);
    const navEl  = document.getElementById(`nav-${viewId}`);
    if (viewEl) viewEl.classList.add('active');
    if (navEl)  navEl.classList.add('active');

    _currentView = viewId;

    // Close sidebar on mobile
    closeSidebar();

    // Render the view
    switch (viewId) {
      case 'dashboard': Views.renderDashboard();          break;
      case 'content':   Views.renderContent();            break;
      case 'groups':    Views.renderGroups();             break;
      case 'plan':      Views.renderPlan();               break;
      case 'assistant': Views.renderAssistant();          break;
      case 'history':   Views.renderHistory();            break;
      case 'settings':  Views.renderSettings();           break;
    }

    // Scroll to top
    document.getElementById('mainContent').scrollTo(0, 0);
  }

  /* ── Modal helpers ── */
  function openModal() {
    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Toast helper ── */
  function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'toastIn .3s ease reverse';
      setTimeout(() => t.remove(), 300);
    }, duration);
  }

  /* ── Copy text to clipboard ── */
  function copyText(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard! 📋', 'success'));
    } else {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('Copied to clipboard! 📋', 'success');
    }
  }

  /* ── Sidebar mobile ── */
  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('active');
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    if (document.getElementById('sidebarOverlay')) {
      document.getElementById('sidebarOverlay').classList.remove('active');
    }
  }

  /* ── Event Delegation ── */
  function bindEvents() {
    // Nav item clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.view));
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', e => {
      if (e.target === document.getElementById('modalOverlay')) closeModal();
    });

    // Hamburger (mobile)
    document.getElementById('hamburgerBtn').addEventListener('click', e => {
      e.stopPropagation();
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });

    // Keyboard: Escape closes modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ── Create sidebar overlay div ── */
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);
    document.body.appendChild(overlay);
  }

  /* ── Init ── */
  function init() {
    // Seed sample data if first launch
    Store.seedIfNeeded();

    // Create mobile overlay
    createOverlay();

    // Bind all events
    bindEvents();

    // Render initial view
    navigate('dashboard');

    console.log('Curacao Oasis Distribution System v1.0 initialized.');
  }

  /* ── Public API ── */
  return {
    navigate, openModal, closeModal, toast, copyText,
    openSidebar, closeSidebar, init
  };
})();

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', App.init);
