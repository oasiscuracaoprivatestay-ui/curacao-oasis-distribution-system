/* ============================================================
   STORE.JS — LocalStorage data layer + sample data seeding
   ============================================================ */
'use strict';

const Store = (() => {
  const KEYS = {
    CONTENT: 'cods_content',
    GROUPS:  'cods_groups',
    LOGS:    'cods_logs',
    PLANS:   'cods_plans',
    SETTINGS:'cods_settings',
    SEEDED:  'cods_seeded_v1'
  };

  /* ── Helpers ── */
  function _get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function _set(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* ── Content ── */
  const getContent  = ()       => _get(KEYS.CONTENT);
  const saveContent = (items)  => _set(KEYS.CONTENT, items);
  const addContent  = (item)   => { const a = getContent(); a.push(item); saveContent(a); return item; };
  const updateContent = (id, u)=> { saveContent(getContent().map(i => i.id===id ? {...i,...u,updatedAt:new Date().toISOString()} : i)); };
  const deleteContent = (id)   => saveContent(getContent().filter(i => i.id!==id));
  const getContentById = (id)  => getContent().find(i => i.id===id) || null;

  /* ── Groups ── */
  const getGroups    = ()       => _get(KEYS.GROUPS);
  const saveGroups   = (g)      => _set(KEYS.GROUPS, g);
  const addGroup     = (group)  => { const a = getGroups(); a.push(group); saveGroups(a); return group; };
  const updateGroup  = (id, u)  => { saveGroups(getGroups().map(g => g.id===id ? {...g,...u} : g)); };
  const deleteGroup  = (id)     => saveGroups(getGroups().filter(g => g.id!==id));
  const getGroupById = (id)     => getGroups().find(g => g.id===id) || null;

  /* ── Logs (history) ── */
  const getLogs  = ()    => _get(KEYS.LOGS);
  const addLog   = (log) => { const a = getLogs(); a.unshift(log); _set(KEYS.LOGS, a); return log; };
  const clearLogs= ()    => _set(KEYS.LOGS, []);

  /* ── Plans ── */
  const getPlans       = ()      => _get(KEYS.PLANS);
  const getPlanForDate = (date)  => getPlans().find(p => p.date===date) || null;
  const savePlan       = (plan)  => {
    const plans = getPlans().filter(p => p.date !== plan.date);
    plans.unshift(plan);
    _set(KEYS.PLANS, plans.slice(0, 60)); // keep 60 days
  };
  const deletePlan     = (date)  => _set(KEYS.PLANS, getPlans().filter(p => p.date!==date));

  /* ── Settings ── */
  const getSettings  = ()  => _get(KEYS.SETTINGS, {});
  const saveSettings = (s) => _set(KEYS.SETTINGS, {...getSettings(), ...s});

  /* ── Factory helpers ── */
  function createContent({ title, originalText, language, type, status='draft', notes='' }) {
    return { id: uid(), title, originalText, language, type, status, notes, variations: [], translations: {}, createdAt: new Date().toISOString() };
  }
  function createGroup({ name, url, language, category, notes='', lastPostedAt=null, source='manual' }) {
    return { id: uid(), name, url, language, category, notes, lastPostedAt, postCount: 0, source, addedAt: new Date().toISOString() };
  }
  function createLog({ contentId, groupId, groupName, text, language, type, contentTitle }) {
    return { id: uid(), contentId, groupId, groupName, text, language, type, contentTitle, postedAt: new Date().toISOString() };
  }

  /* ── Sample Data ── */
  function seedIfNeeded() {
    if (_get(KEYS.SEEDED, false)) return;

    const sampleContent = [
      createContent({
        title: 'Sea View Apartment — EN',
        originalText: `🌊 Wake up to stunning Caribbean views from your private balcony!\n\nOur Sea View Apartment in Curaçao is fully furnished, air-conditioned, and just minutes from the beach. Perfect for couples and small families looking for a relaxing island escape.\n\n✅ Free WiFi included\n✅ Private parking\n✅ Weekly rates available\n\nBook directly via WhatsApp and save on booking fees! 📲\nMessage us: +5999-XXXXXXX`,
        language: 'en', type: 'image', status: 'ready'
      }),
      createContent({
        title: 'Villa met Zwembad — NL',
        originalText: `🌴 Droomvakantie op Curaçao — rechtstreeks boeken!\n\nOnze sfeervol gemeubileerde villa ligt op loopafstand van het strand en biedt alle comfort voor een onvergetelijk verblijf.\n\n✅ Privézwembad\n✅ Volledig uitgeruste keuken\n✅ Airconditioning in alle kamers\n\nBoek direct via WhatsApp en vermijd bemiddelingskosten! 💬\nStuur een bericht: +5999-XXXXXXX`,
        language: 'nl', type: 'text', status: 'ready'
      }),
      createContent({
        title: 'Apartamento de Lujo — ES',
        originalText: `☀️ ¡Vive unas vacaciones perfectas en Curaçao!\n\nNuestro apartamento de lujo cuenta con vista al mar, terraza privada y todo lo que necesitas para descansar de verdad.\n\n✅ WiFi gratuito\n✅ Aire acondicionado\n✅ A 5 minutos de la playa\n\n¡Reserva directamente por WhatsApp y ahorra en comisiones! 📱\nEscríbenos: +5999-XXXXXXX`,
        language: 'es', type: 'image', status: 'ready'
      }),
      createContent({
        title: 'Reel: Island Life Highlights — EN',
        originalText: `🎥 This is what a perfect Curaçao morning looks like...\n\nColourful streets, crystal-clear water, and your own private villa waiting for you.\n\n🏖️ Book your island escape directly — no middleman, no extra fees.\n\nDM us on WhatsApp to check availability: +5999-XXXXXXX\n\n#CuracaoOasis #IslandLife #VacationRental #DirectBooking`,
        language: 'en', type: 'reel', status: 'ready'
      }),
      createContent({
        title: 'Vakantieverhuur Reel — NL',
        originalText: `🎬 Zo ziet een perfecte ochtend op Curaçao eruit...\n\nKleurrijke straten, kristalhelder water en jouw eigen villa of appartement.\n\n🌊 Boek direct via WhatsApp — zonder tussenpersoon, zonder extra kosten.\n\nStuur ons een berichtje: +5999-XXXXXXX\n\n#CuracaoOasis #Vakantie #Caribisch #DirectBoeken`,
        language: 'nl', type: 'reel', status: 'draft'
      }),
      createContent({
        title: 'Text Post: Direct Booking Benefits — EN',
        originalText: `💡 Why book directly with Curacao Oasis?\n\n→ No booking platform fees\n→ Flexible check-in times\n→ Personal support via WhatsApp\n→ Best rate guaranteed\n→ Local tips & recommendations included!\n\nReady to plan your Curaçao holiday? Send us a message on WhatsApp: +5999-XXXXXXX\n\nWe reply fast — usually within the hour! ⚡`,
        language: 'en', type: 'text', status: 'ready'
      })
    ];

    const sampleGroups = [
      createGroup({ name: 'Curaçao Vacation Rentals & Real Estate', url: 'https://www.facebook.com/groups/example1', language: 'en', category: 'vacation rental', notes: 'High-quality group, active daily', source: 'sample' }),
      createGroup({ name: 'Expats in Curaçao', url: 'https://www.facebook.com/groups/example2', language: 'en', category: 'expat', notes: 'Expat community, good for long-stay inquiries', source: 'sample' }),
      createGroup({ name: 'Curaçao Marketplace — Buy & Sell', url: 'https://www.facebook.com/groups/example3', language: 'en', category: 'marketplace', notes: 'General marketplace, 3x per week max', source: 'sample' }),
      createGroup({ name: 'Caribbean Travel & Island Life', url: 'https://www.facebook.com/groups/example4', language: 'en', category: 'general', notes: 'Travel enthusiasts, use reel descriptions', source: 'sample' }),
      createGroup({ name: 'Vakantie op Curaçao — Huur & Verhuur', url: 'https://www.facebook.com/groups/example5', language: 'nl', category: 'vacation rental', notes: 'Dutch-speaking, very relevant', source: 'sample' }),
      createGroup({ name: 'Nederlanders op Curaçao', url: 'https://www.facebook.com/groups/example6', language: 'nl', category: 'expat', notes: 'Dutch expat community', source: 'sample' }),
      createGroup({ name: 'Curaçao Koopjes & Aanbiedingen', url: 'https://www.facebook.com/groups/example7', language: 'nl', category: 'marketplace', notes: 'Dutch marketplace', source: 'sample' }),
      createGroup({ name: 'Alquiler Vacacional Curaçao', url: 'https://www.facebook.com/groups/example8', language: 'es', category: 'vacation rental', notes: 'Spanish vacation rental group', source: 'sample' }),
      createGroup({ name: 'Curaçao en Español — Turismo y Viajes', url: 'https://www.facebook.com/groups/example9', language: 'es', category: 'general', notes: 'Spanish travel community', source: 'sample' }),
      createGroup({ name: 'Real Estate & Rentals Caribbean', url: 'https://www.facebook.com/groups/example10', language: 'en', category: 'real estate', notes: 'Real estate focused, use professional tone', source: 'sample' })
    ];

    saveContent(sampleContent);
    saveGroups(sampleGroups);
    _set(KEYS.SEEDED, true);
    console.log('CODS: Sample data seeded successfully.');
  }

  /* ── Remove all sample groups ── */
  const removeSampleGroups = () => saveGroups(getGroups().filter(g => g.source !== 'sample'));
  /* ── Get counts by source ── */
  const getSampleGroupCount   = () => getGroups().filter(g => g.source === 'sample').length;
  const getImportedGroupCount = () => getGroups().filter(g => g.source === 'imported').length;

  return {
    KEYS, uid,
    getContent, saveContent, addContent, updateContent, deleteContent, getContentById,
    getGroups, saveGroups, addGroup, updateGroup, deleteGroup, getGroupById,
    getLogs, addLog, clearLogs,
    getPlans, getPlanForDate, savePlan, deletePlan,
    getSettings, saveSettings,
    createContent, createGroup, createLog,
    removeSampleGroups, getSampleGroupCount, getImportedGroupCount,
    seedIfNeeded
  };
})();
