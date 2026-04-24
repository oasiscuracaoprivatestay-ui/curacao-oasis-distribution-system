/* ============================================================
   ENGINE.JS — Variation Engine + Multi-Language Adapter
   Rule-based, fully offline. GPT placeholder included.
   ============================================================ */
'use strict';

const Engine = (() => {

  /* ══════════════════════════════════════════════════════
     SECTION 1 — VARIATION ENGINE (Rule-Based, Offline)
     ══════════════════════════════════════════════════════ */

  const EN_SYNONYMS = {
    'stunning':       ['breathtaking','gorgeous','spectacular','amazing','beautiful'],
    'beautiful':      ['stunning','gorgeous','lovely','breathtaking','wonderful'],
    'gorgeous':       ['stunning','breathtaking','beautiful','spectacular'],
    'perfect':        ['ideal','wonderful','great','an excellent'],
    'relaxing':       ['peaceful','rejuvenating','tranquil','blissful'],
    'amazing':        ['incredible','fantastic','outstanding','wonderful'],
    'holiday':        ['vacation','getaway','retreat','escape'],
    'vacation':       ['holiday','getaway','retreat','escape'],
    'escape':         ['getaway','retreat','holiday','break'],
    'getaway':        ['escape','retreat','holiday','break'],
    'comfortable':    ['cosy','welcoming','homely','well-appointed'],
    'fully furnished':['beautifully furnished','tastefully decorated','well-equipped and furnished'],
    'just minutes':   ['only a short drive','a quick walk','moments'],
    'crystal-clear':  ['sparkling','pristine','turquoise'],
    'island':         ['tropical','Caribbean','paradise'],
    'directly':       ['straight','right'],
    'available':      ['on offer','ready','waiting for you'],
    'included':       ['at no extra cost','as standard','complimentary'],
    'personal':       ['dedicated','direct','one-on-one'],
    'flexible':       ['adaptable','easy-going','convenient'],
    'fast':           ['quickly','promptly','within minutes'],
    'usually':        ['typically','in most cases','as a rule'],
    'recommend':      ['suggest','advise','propose'],
    'contact':        ['reach out to','get in touch with','message'],
    'share':          ['post','spread','let others know about']
  };

  const NL_SYNONYMS = {
    'prachtig':      ['schitterend','adembenemend','geweldig','fantastisch'],
    'sfeervol':      ['gezellig','stijlvol','aangenaam','behaaglijk'],
    'comfortabel':   ['aangenaam','ruim','luxe','gerieflijk'],
    'direct':        ['rechtstreeks','meteen','zonder tussenpersoon'],
    'strand':        ['zee','kust','waterrand'],
    'vakantie':      ['verblijf','reis','uitje','uitstapje'],
    'villa':         ['woning','bungalow','verblijf','accommodatie'],
    'apartement':    ['appartement','studio','verblijf'],
    'beschikbaar':   ['vrij','gereserveerd worden','te boeken'],
    'volledig':      ['compleet','geheel','totaal'],
    'gratis':        ['kosteloos','geen extra kosten','inclusief'],
    'snel':          ['vlot','meteen','direct'],
    'gezellig':      ['sfeervol','aangenaam','knusse'],
    'onvergetelijk': ['bijzonder','uniek','geweldig']
  };

  const ES_SYNONYMS = {
    'perfecto':      ['ideal','excelente','magnífico','estupendo'],
    'hermoso':       ['precioso','espectacular','maravilloso','increíble'],
    'lujoso':        ['elegante','exclusivo','de lujo','premium'],
    'relajante':     ['tranquilo','apacible','sereno','placentero'],
    'disponible':    ['libre','reservable','a tu disposición'],
    'directo':       ['directamente','sin intermediarios','sin comisiones'],
    'vacaciones':    ['estadía','viaje','escapada','descanso'],
    'playa':         ['mar','costa','orilla'],
    'apartamento':   ['piso','estudio','alojamiento'],
    'increíble':     ['fantástico','magnífico','espectacular','maravilloso'],
    'gratis':        ['gratuito','sin costo','incluido','de cortesía'],
    'rápido':        ['rápidamente','enseguida','de inmediato'],
    'comodidad':     ['confort','bienestar','comodidades']
  };

  const SYNONYM_MAP = { en: EN_SYNONYMS, nl: NL_SYNONYMS, es: ES_SYNONYMS };

  /* CTA detection patterns */
  const CTA_PATTERNS = [
    /whatsapp/i, /📲/, /📱/, /💬/, /\+5999/, /book direct/i,
    /boek direct/i, /reserva direct/i, /reply fast/i, /send us/i,
    /stuur .*bericht/i, /escríbenos/i, /dm us/i
  ];

  function detectCTALines(text) {
    const lines = text.split('\n');
    return lines.filter(l => CTA_PATTERNS.some(p => p.test(l)));
  }

  function applySynonyms(text, lang) {
    const synonyms = SYNONYM_MAP[lang] || SYNONYM_MAP.en;
    let out = text;
    for (const [word, alts] of Object.entries(synonyms)) {
      const re = new RegExp(`\\b${word}\\b`, 'gi');
      out = out.replace(re, (match) => {
        const picked = alts[Math.floor(Math.random() * alts.length)];
        return match[0] === match[0].toUpperCase() ? picked.charAt(0).toUpperCase() + picked.slice(1) : picked;
      });
    }
    return out;
  }

  const EN_HOOKS = [
    '🌟 Looking for the perfect island escape?',
    '🌴 Your dream Curaçao vacation is closer than you think.',
    '☀️ Imagine waking up to turquoise waters and warm Caribbean breezes...',
    '🏖️ Ready for a holiday you\'ll never forget?',
    '✨ Not all Curaçao stays are created equal — here\'s why ours stand out.'
  ];

  const NL_HOOKS = [
    '🌟 Op zoek naar de perfecte vakantie op Curaçao?',
    '🌴 Je droomvakantie op Curaçao begint hier.',
    '☀️ Stel je voor: wakker worden met uitzicht op het turquoise Caribische water...',
    '🏖️ Klaar voor een onvergetelijk verblijf op het eiland?',
    '✨ Niet elke vakantie op Curaçao is gelijk — ontdek waarom de onze anders is.'
  ];

  const ES_HOOKS = [
    '🌟 ¿Buscas la escapada perfecta en el Caribe?',
    '🌴 Tus vacaciones soñadas en Curaçao empiezan aquí.',
    '☀️ Imagina despertar con vistas al mar turquesa de Curaçao...',
    '🏖️ ¿Listo para unas vacaciones que nunca olvidarás?',
    '✨ No todos los alojamientos en Curaçao son iguales — descubre por qué el nuestro destaca.'
  ];

  const HOOK_MAP = { en: EN_HOOKS, nl: NL_HOOKS, es: ES_HOOKS };

  /**
   * Generate 2–3 natural variations of a content item.
   * CTA lines are always preserved exactly.
   */
  function generateVariations(text, lang, count = 3) {
    const ctaLines = detectCTALines(text);
    const nonCtaLines = text.split('\n').filter(l => !ctaLines.includes(l));
    const hooks = HOOK_MAP[lang] || HOOK_MAP.en;

    const variants = [];
    const usedHookIdx = new Set();

    for (let i = 0; i < count; i++) {
      // Pick unique hook
      let hookIdx;
      do { hookIdx = Math.floor(Math.random() * hooks.length); }
      while (usedHookIdx.has(hookIdx) && usedHookIdx.size < hooks.length);
      usedHookIdx.add(hookIdx);

      // Apply synonyms to body
      const bodyText = nonCtaLines.join('\n');
      let varied = applySynonyms(bodyText, lang);

      // For variant 2+, lightly rearrange bullet-like lines
      if (i > 0) {
        const varLines = varied.split('\n');
        const bullets = varLines.filter(l => l.trim().startsWith('✅') || l.trim().startsWith('→') || l.trim().startsWith('•'));
        const rest = varLines.filter(l => !bullets.includes(l));
        // Shuffle bullets
        for (let b = bullets.length - 1; b > 0; b--) {
          const j = Math.floor(Math.random() * (b + 1));
          [bullets[b], bullets[j]] = [bullets[j], bullets[b]];
        }
        varied = [...rest.slice(0, 1), ...bullets, ...rest.slice(1)].join('\n');
      }

      // If first non-empty line isn't the hook emoji line, prepend hook
      const finalLines = varied.split('\n').filter(l => l.trim());
      const firstLine = finalLines[0] || '';
      const isAlreadyHooked = /^[🌊🌴☀️🏖️✨🌟🎥💡]/.test(firstLine);

      let result;
      if (isAlreadyHooked) {
        // Replace the hook line with a fresh hook
        finalLines[0] = hooks[hookIdx];
        result = finalLines.join('\n');
      } else {
        result = hooks[hookIdx] + '\n\n' + varied;
      }

      // Always append CTA
      if (ctaLines.length > 0) {
        result = result.trimEnd() + '\n\n' + ctaLines.join('\n');
      }

      variants.push(result.trim());
    }

    return variants;
  }

  /* ══════════════════════════════════════════════════════
     SECTION 2 — MULTI-LANGUAGE ADAPTER
     Template-based natural adaptation (NOT word-for-word)
     ══════════════════════════════════════════════════════ */

  /**
   * Generate an EN/ES/NL adaptation from any source text.
   * Extracts key content signals (amenities, CTA number) and
   * rebuilds a natural-sounding post in each target language.
   */
  function adaptToLanguage(text, targetLang) {
    // Extract WhatsApp number if present
    const waMatch = text.match(/\+[\d\s\-]+/);
    const waNumber = waMatch ? waMatch[0].trim() : '+5999-XXXXXXX';

    // Detect content signals
    const hasPool    = /pool|zwembad|piscina/i.test(text);
    const hasWifi    = /wifi|wi-fi/i.test(text);
    const hasParking = /parking|parkeer|estacionamiento/i.test(text);
    const hasBeach   = /beach|strand|playa|minuto.*strand|beach.*minute/i.test(text);
    const hasAC      = /air.?condit|airco|aire acondiciona/i.test(text);
    const hasKitchen = /kitchen|keuken|cocina/i.test(text);
    const isReel     = /reel|video|🎥|🎬/i.test(text);
    const isListPost = /→|✅|•/.test(text);

    const amenityList = [
      hasWifi    && { en:'Free WiFi',         nl:'Gratis WiFi',           es:'WiFi gratuito'        },
      hasParking && { en:'Private parking',   nl:'Privéparkeerplek',      es:'Estacionamiento privado' },
      hasPool    && { en:'Private pool',      nl:'Privézwembad',          es:'Piscina privada'      },
      hasBeach   && { en:'Close to the beach',nl:'Op loopafstand van het strand', es:'A minutos de la playa'},
      hasAC      && { en:'Air conditioning',  nl:'Airconditioning',       es:'Aire acondicionado'   },
      hasKitchen && { en:'Full kitchen',      nl:'Volledig uitgeruste keuken', es:'Cocina completa' }
    ].filter(Boolean);

    const amenitiesEn = amenityList.map(a => `✅ ${a.en}`).join('\n');
    const amenitiesNl = amenityList.map(a => `✅ ${a.nl}`).join('\n');
    const amenitiesEs = amenityList.map(a => `✅ ${a.es}`).join('\n');

    if (targetLang === 'en') {
      if (isReel) {
        return `🎥 This is what your perfect Caribbean morning looks like...\n\nSun, sea, and a beautiful place to call home for a week — that\'s the Curaçao Oasis experience.\n\n🌊 Book directly with us and skip the booking fees. Personal service, best rates, and local tips included.\n\n📲 Message us on WhatsApp: ${waNumber}\n\n#CuracaoOasis #IslandLife #VacationRental #DirectBooking`;
      }
      if (isListPost) {
        return `💡 Here\'s why smart travellers book directly with Curacao Oasis:\n\n${amenitiesEn || '✅ No booking fees\n✅ Flexible check-in\n✅ Personal WhatsApp support'}\n\nReady to plan your Curaçao getaway? We\'re here to help!\n\n📲 Book via WhatsApp: ${waNumber}\nWe typically reply within the hour! ⚡`;
      }
      return `🌊 Experience the beauty of Curaçao from your own private retreat.\n\nOur fully furnished, air-conditioned accommodation offers everything you need for the perfect island holiday.\n\n${amenitiesEn}\n\nBook directly with us via WhatsApp — no middleman, no extra fees, just a smooth and personal booking experience.\n\n📲 Contact us: ${waNumber}`;
    }

    if (targetLang === 'nl') {
      if (isReel) {
        return `🎬 Zo ziet jouw perfecte Caribische ochtend eruit...\n\nZon, zee en een prachtige plek om even helemaal tot rust te komen — dat is de Curaçao Oasis ervaring.\n\n🌊 Boek direct bij ons en bespaar op bemiddelingskosten. Persoonlijke service, de beste prijs en lokale tips inbegrepen.\n\n💬 Stuur ons een WhatsApp bericht: ${waNumber}\n\n#CuracaoOasis #Vakantie #Caribisch #DirectBoeken`;
      }
      if (isListPost) {
        return `💡 Waarom slimme reizigers direct boeken bij Curacao Oasis:\n\n${amenitiesNl || '✅ Geen reserveringskosten\n✅ Flexibele check-in\n✅ Persoonlijke WhatsApp support'}\n\nKlaar om jouw Curaçaovakantie te plannen? We helpen je graag!\n\n💬 Boek via WhatsApp: ${waNumber}\nWe reageren doorgaans binnen een uur! ⚡`;
      }
      return `🌴 Geniet van het beste wat Curaçao te bieden heeft — vanuit jouw eigen privéverblijf.\n\nOnze volledig gemeubileerde, gekoelde accommodatie biedt alles wat je nodig hebt voor een perfecte eilandvakantie.\n\n${amenitiesNl}\n\nBoek direct via WhatsApp — zonder tussenpersoon, zonder extra kosten, maar met heel veel persoonlijke aandacht.\n\n💬 Stuur ons een bericht: ${waNumber}`;
    }

    if (targetLang === 'es') {
      if (isReel) {
        return `🎥 Así se ve tu mañana perfecta en el Caribe...\n\nSol, mar y un lugar hermoso para llamar hogar durante una semana — eso es la experiencia Curaçao Oasis.\n\n🌊 Reserva directamente con nosotros y olvídate de las comisiones. Servicio personal, mejores tarifas y consejos locales incluidos.\n\n📱 Escríbenos por WhatsApp: ${waNumber}\n\n#CuracaoOasis #VidaIsleña #AlquilerVacacional #ReservaDirecta`;
      }
      if (isListPost) {
        return `💡 Por qué los viajeros inteligentes reservan directamente con Curacao Oasis:\n\n${amenitiesEs || '✅ Sin comisiones\n✅ Check-in flexible\n✅ Atención personalizada por WhatsApp'}\n\n¿Listo para planificar tus vacaciones en Curaçao? ¡Estamos aquí para ayudarte!\n\n📱 Reserva por WhatsApp: ${waNumber}\n¡Respondemos normalmente en menos de una hora! ⚡`;
      }
      return `☀️ Vive la belleza de Curaçao desde tu propio refugio privado.\n\nNuestro alojamiento completamente amueblado y con aire acondicionado ofrece todo lo que necesitas para unas vacaciones isleñas perfectas.\n\n${amenitiesEs}\n\nReserva directamente con nosotros por WhatsApp — sin intermediarios, sin tarifas adicionales, solo una experiencia de reserva sencilla y personal.\n\n📱 Contáctanos: ${waNumber}`;
    }

    return text; // fallback
  }

  /* ══════════════════════════════════════════════════════
     SECTION 3 — GPT PLACEHOLDER
     Replace the body of this function with an actual
     OpenAI / Gemini API call when ready.
     ══════════════════════════════════════════════════════ */

  /**
   * GPT-powered variation generator (PLACEHOLDER).
   *
   * HOW TO ACTIVATE:
   * 1. Go to Settings and enter your OpenAI API key.
   * 2. Replace the body of this function with a fetch() call
   *    to https://api.openai.com/v1/chat/completions
   * 3. Use the prompt below as your system + user message.
   *
   * EXAMPLE PROMPT (copy into your API call):
   * System: "You are a vacation rental marketing copywriter for Curaçao Oasis.
   *   Rewrite the provided Facebook post into 3 natural variations.
   *   Keep the same meaning, keep the WhatsApp CTA, and use a warm,
   *   professional tone suitable for vacation rental marketing.
   *   Language: {lang}. Return JSON array of 3 strings."
   * User: "{original_text}"
   *
   * @param {string} text - Original post text
   * @param {string} lang - Language code: en / es / nl
   * @param {string} apiKey - OpenAI API key from settings
   * @returns {Promise<string[]>} - Array of variation strings
   */
  async function generateVariationsGPT(text, lang, apiKey) {
    if (!apiKey) throw new Error('No API key provided. Enter your key in Settings.');

    // ── PLACEHOLDER: Replace with actual API call ──
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     model: 'gpt-4o-mini',
    //     messages: [
    //       { role: 'system', content: `You are a vacation rental copywriter for Curaçao Oasis...` },
    //       { role: 'user', content: text }
    //     ],
    //     temperature: 0.8
    //   })
    // });
    // const data = await response.json();
    // return JSON.parse(data.choices[0].message.content);

    // Fallback to rule-based while placeholder is active:
    console.warn('GPT variation engine not yet configured. Using rule-based fallback.');
    return generateVariations(text, lang, 3);
  }

  /* ── Public API ── */
  return {
    generateVariations,
    adaptToLanguage,
    generateVariationsGPT
  };
})();
