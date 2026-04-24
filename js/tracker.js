/* ============================================================
   TRACKER.JS — Post Tracking & History
   ============================================================ */
'use strict';

const Tracker = (() => {

  /**
   * Get today's posting stats.
   */
  function getTodayStats() {
    const todayStr = Planner.today();
    const logs = Store.getLogs();
    const todayLogs = logs.filter(l => l.postedAt && l.postedAt.startsWith(todayStr));
    return {
      totalToday: todayLogs.length,
      languages:  [...new Set(todayLogs.map(l => l.language))],
      groups:     [...new Set(todayLogs.map(l => l.groupName))]
    };
  }

  /**
   * Get overall stats.
   */
  function getOverallStats() {
    const logs     = Store.getLogs();
    const content  = Store.getContent();
    const groups   = Store.getGroups();
    const plans    = Store.getPlans();
    const todayStr = Planner.today();
    const todayPlan = Store.getPlanForDate(todayStr);
    const flatToday = todayPlan ? Planner.getFlatPlan(todayPlan) : [];

    return {
      totalContent:   content.length,
      readyContent:   content.filter(c => c.status === 'ready').length,
      totalGroups:    groups.length,
      totalPosts:     logs.length,
      postsToday:     logs.filter(l => l.postedAt && l.postedAt.startsWith(todayStr)).length,
      planItemsToday: flatToday.length,
      planDoneToday:  flatToday.filter(i => i.done).length
    };
  }

  /**
   * Filter history logs.
   * @param {Object} filters - { lang, groupName, dateFrom, dateTo, search }
   */
  function getFilteredLogs({ lang, groupName, dateFrom, dateTo, search } = {}) {
    let logs = Store.getLogs();

    if (lang)      logs = logs.filter(l => l.language === lang);
    if (groupName) logs = logs.filter(l => l.groupName && l.groupName.toLowerCase().includes(groupName.toLowerCase()));
    if (dateFrom)  logs = logs.filter(l => l.postedAt >= dateFrom);
    if (dateTo)    logs = logs.filter(l => l.postedAt <= dateTo + 'T23:59:59');
    if (search)    logs = logs.filter(l =>
      (l.contentTitle && l.contentTitle.toLowerCase().includes(search.toLowerCase())) ||
      (l.groupName    && l.groupName.toLowerCase().includes(search.toLowerCase()))
    );

    return logs;
  }

  /**
   * Format a date string for display.
   */
  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function formatDateShort(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return { getTodayStats, getOverallStats, getFilteredLogs, formatDate, formatDateShort };
})();
