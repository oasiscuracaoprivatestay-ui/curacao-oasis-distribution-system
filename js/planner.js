/* ============================================================
   PLANNER.JS — Group Matcher + Daily Plan Generator
   ============================================================ */
'use strict';

const Planner = (() => {

  /* ── Category priority scores (higher = more relevant) ── */
  const CAT_SCORES = {
    'vacation rental': 10,
    'real estate':      7,
    'marketplace':      5,
    'expat':            6,
    'general':          3
  };

  /* ── How many days before we can repost to same group ── */
  const GROUP_COOLDOWN_DAYS = 3;

  /* ── Max posts per day ── */
  const MAX_MORNING  = 3;
  const MAX_EVENING  = 3;

  /* ── Utility ── */
  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function daysBetween(isoA, isoB) {
    if (!isoA || !isoB) return Infinity;
    return Math.abs((new Date(isoA) - new Date(isoB)) / 86400000);
  }

  /**
   * Score a group for a given content item.
   * Returns a numeric score — higher is better.
   */
  function scoreGroupForContent(group, content, todayStr) {
    let score = 0;

    // Language match is mandatory (0 = skip)
    if (group.language !== content.language) return -1;

    // Category relevance
    score += CAT_SCORES[group.category] || 2;

    // Freshness: prefer groups not posted to recently
    if (!group.lastPostedAt) {
      score += 8; // never posted = high priority
    } else {
      const daysSince = daysBetween(group.lastPostedAt, todayStr);
      if (daysSince >= GROUP_COOLDOWN_DAYS) {
        score += Math.min(daysSince, 8); // fresher gap = higher score, capped
      } else {
        score -= (GROUP_COOLDOWN_DAYS - daysSince) * 3; // penalize too-recent
      }
    }

    return score;
  }

  /**
   * Match content items to groups.
   * Returns [{content, group, score}] sorted by score desc.
   */
  function matchContentToGroups(contents, groups) {
    const todayStr = today();
    const matches = [];

    for (const content of contents) {
      if (content.status !== 'ready') continue;
      for (const group of groups) {
        const score = scoreGroupForContent(group, content, todayStr);
        if (score >= 0) {
          matches.push({ content, group, score });
        }
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Pick the best text for a content item:
   * - If variations exist, pick the one least recently used.
   * - Otherwise use original text.
   */
  function pickBestText(content, logs) {
    const allTexts = [content.originalText, ...(content.variations || [])];
    if (allTexts.length === 1) return allTexts[0];

    // Find which variations have been used
    const usedTexts = new Set(logs.map(l => l.text));
    const unused = allTexts.filter(t => !usedTexts.has(t));
    if (unused.length > 0) return unused[0];

    // All used — pick the one used longest ago
    const lastUsedMap = {};
    for (const log of logs) {
      if (!lastUsedMap[log.text] || log.postedAt < lastUsedMap[log.text]) {
        lastUsedMap[log.text] = log.postedAt;
      }
    }
    return allTexts.sort((a, b) => {
      const ta = lastUsedMap[a] || '0';
      const tb = lastUsedMap[b] || '0';
      return ta < tb ? -1 : 1; // oldest first
    })[0];
  }

  /**
   * Generate a daily posting plan.
   * @param {string} date - ISO date string (YYYY-MM-DD), defaults to today
   * @returns {Object} { date, morning: [...], evening: [...] }
   */
  function generatePlan(date) {
    const planDate = date || today();
    const contents = Store.getContent().filter(c => c.status === 'ready');
    const groups   = Store.getGroups();
    const logs     = Store.getLogs();

    if (contents.length === 0 || groups.length === 0) {
      return { date: planDate, morning: [], evening: [], generated: new Date().toISOString() };
    }

    const matches = matchContentToGroups(contents, groups);

    const usedGroupIds   = new Set();
    const usedContentIds = new Set();
    const morning = [];
    const evening = [];

    // Fill morning slots
    for (const match of matches) {
      if (morning.length >= MAX_MORNING) break;
      if (usedGroupIds.has(match.group.id)) continue;

      const text = pickBestText(match.content, logs);
      morning.push({
        contentId:    match.content.id,
        contentTitle: match.content.title,
        groupId:      match.group.id,
        groupName:    match.group.name,
        groupUrl:     match.group.url,
        language:     match.content.language,
        type:         match.content.type,
        text,
        session:      'morning',
        done:         false
      });
      usedGroupIds.add(match.group.id);
      usedContentIds.add(match.content.id);
    }

    // Fill evening slots — prefer different content AND different groups
    for (const match of matches) {
      if (evening.length >= MAX_EVENING) break;
      if (usedGroupIds.has(match.group.id)) continue;

      const text = pickBestText(match.content, logs);
      evening.push({
        contentId:    match.content.id,
        contentTitle: match.content.title,
        groupId:      match.group.id,
        groupName:    match.group.name,
        groupUrl:     match.group.url,
        language:     match.content.language,
        type:         match.content.type,
        text,
        session:      'evening',
        done:         false
      });
      usedGroupIds.add(match.group.id);
    }

    const plan = {
      date: planDate,
      morning,
      evening,
      generated: new Date().toISOString()
    };

    Store.savePlan(plan);
    return plan;
  }

  /**
   * Mark a plan item as done and log it.
   * @param {string} date - plan date
   * @param {string} session - 'morning' or 'evening'
   * @param {number} index - index in session array
   */
  function markItemDone(date, session, index) {
    const plan = Store.getPlanForDate(date);
    if (!plan) return null;

    const item = plan[session][index];
    if (!item) return null;

    item.done = true;
    item.doneAt = new Date().toISOString();

    Store.savePlan(plan);

    // Log the post
    const log = Store.createLog({
      contentId:    item.contentId,
      groupId:      item.groupId,
      groupName:    item.groupName,
      text:         item.text,
      language:     item.language,
      type:         item.type,
      contentTitle: item.contentTitle
    });
    Store.addLog(log);

    // Update group's lastPostedAt
    Store.updateGroup(item.groupId, { lastPostedAt: new Date().toISOString(), postCount: (Store.getGroupById(item.groupId)?.postCount || 0) + 1 });

    return log;
  }

  /**
   * Get all plan items as a flat list.
   */
  function getFlatPlan(plan) {
    if (!plan) return [];
    return [
      ...plan.morning.map((i, idx) => ({ ...i, session: 'morning', index: idx })),
      ...plan.evening.map((i, idx) => ({ ...i, session: 'evening', index: idx }))
    ];
  }

  return { generatePlan, matchContentToGroups, markItemDone, getFlatPlan, today };
})();
