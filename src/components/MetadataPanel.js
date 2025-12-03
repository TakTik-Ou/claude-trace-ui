/**
 * MetadataPanel Component
 * Displays session metadata including token usage, duration, and statistics
 */

import { h, clearChildren } from '../utils/dom-helpers.js';
import { formatDateTime, formatDuration } from '../utils/date-formatter.js';
import { EventEmitter } from '../lib/EventEmitter.js';

/**
 * @typedef {import('../types/session').Session} Session
 */

/**
 * Format large numbers with K/M suffixes
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

/**
 * Calculate cost estimate based on tokens
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {number} Estimated cost in USD
 */
function estimateCost(inputTokens, outputTokens) {
  // Claude pricing estimates (may vary)
  const inputCost = (inputTokens / 1_000_000) * 3; // $3/M input tokens
  const outputCost = (outputTokens / 1_000_000) * 15; // $15/M output tokens
  return inputCost + outputCost;
}

export class MetadataPanel extends EventEmitter {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super();
    this.container = container;
    /** @type {Session|null} */
    this.session = null;
    /** @type {boolean} */
    this.isCollapsed = false;

    this.init();
  }

  init() {
    this.container.className = 'metadata-panel h-full bg-gray-900 border-l border-gray-700 overflow-y-auto';
    this.render();
  }

  render() {
    clearChildren(this.container);

    if (!this.session) {
      const emptyState = h('div', { className: 'p-4 text-center text-gray-500 text-sm' }, ['Select a session to view metadata']);
      this.container.appendChild(emptyState);
      return;
    }

    // Header
    const header = h('div', { className: 'p-3 border-b border-gray-700 flex items-center justify-between' }, [
      h('h3', { className: 'text-sm font-medium text-gray-300' }, ['Session Info']),
      h(
        'button',
        {
          className: 'text-gray-500 hover:text-gray-300 p-1',
          onClick: () => this.toggleCollapse(),
          title: this.isCollapsed ? 'Expand' : 'Collapse'
        },
        [this.isCollapsed ? '▶' : '▼']
      )
    ]);
    this.container.appendChild(header);

    if (this.isCollapsed) return;

    // Token usage section
    const tokenSection = this.createTokenSection();
    this.container.appendChild(tokenSection);

    // Session stats section
    const statsSection = this.createStatsSection();
    this.container.appendChild(statsSection);

    // Technical info section
    const techSection = this.createTechnicalSection();
    this.container.appendChild(techSection);
  }

  /**
   * Create token usage section
   * @returns {HTMLElement}
   */
  createTokenSection() {
    const { tokenUsage } = this.session;
    const hasTokens = tokenUsage && (tokenUsage.input > 0 || tokenUsage.output > 0);

    const section = h('div', { className: 'p-3 border-b border-gray-700' }, [h('h4', { className: 'text-xs font-medium text-gray-500 uppercase mb-2' }, ['Token Usage'])]);

    if (!hasTokens) {
      section.appendChild(h('p', { className: 'text-sm text-gray-500' }, ['No token data available']));
      return section;
    }

    const inputTokens = tokenUsage.input || 0;
    const outputTokens = tokenUsage.output || 0;
    const totalTokens = inputTokens + outputTokens;
    const cacheTokens = tokenUsage.cacheCreation || 0;
    const cost = estimateCost(inputTokens, outputTokens);

    // Token bars
    const tokenBars = h('div', { className: 'space-y-2' });

    // Input tokens
    tokenBars.appendChild(this.createTokenBar('Input', inputTokens, totalTokens, 'bg-blue-500'));

    // Output tokens
    tokenBars.appendChild(this.createTokenBar('Output', outputTokens, totalTokens, 'bg-green-500'));

    // Cache tokens (if any)
    if (cacheTokens > 0) {
      tokenBars.appendChild(this.createTokenBar('Cache', cacheTokens, totalTokens, 'bg-purple-500'));
    }

    section.appendChild(tokenBars);

    // Total and cost
    const summary = h('div', { className: 'mt-3 pt-2 border-t border-gray-700 space-y-1' }, [
      h('div', { className: 'flex justify-between text-sm' }, [h('span', { className: 'text-gray-400' }, ['Total']), h('span', { className: 'text-gray-200 font-medium' }, [formatNumber(totalTokens)])]),
      h('div', { className: 'flex justify-between text-sm' }, [h('span', { className: 'text-gray-400' }, ['Est. Cost']), h('span', { className: 'text-green-400' }, [`$${cost.toFixed(4)}`])])
    ]);
    section.appendChild(summary);

    return section;
  }

  /**
   * Create a token bar visualization
   * @param {string} label
   * @param {number} value
   * @param {number} total
   * @param {string} colorClass
   * @returns {HTMLElement}
   */
  createTokenBar(label, value, total, colorClass) {
    const percentage = total > 0 ? (value / total) * 100 : 0;

    return h('div', {}, [
      h('div', { className: 'flex justify-between text-xs mb-1' }, [h('span', { className: 'text-gray-400' }, [label]), h('span', { className: 'text-gray-300' }, [formatNumber(value)])]),
      h('div', { className: 'h-2 bg-gray-700 rounded-full overflow-hidden' }, [
        h('div', {
          className: `h-full ${colorClass} rounded-full`,
          style: `width: ${percentage}%`
        })
      ])
    ]);
  }

  /**
   * Create session stats section
   * @returns {HTMLElement}
   */
  createStatsSection() {
    const { createdAt, updatedAt, messageCount, events } = this.session;
    const duration = updatedAt - createdAt;

    // Count event types
    const eventCounts = {
      user: 0,
      assistant: 0,
      tool: 0
    };

    (events || []).forEach((e) => {
      if (e.type === 'user') eventCounts.user++;
      else if (e.type === 'assistant') eventCounts.assistant++;
      else if (e.type === 'tool_use' || e.type === 'tool_result') eventCounts.tool++;
    });

    const section = h('div', { className: 'p-3 border-b border-gray-700' }, [h('h4', { className: 'text-xs font-medium text-gray-500 uppercase mb-2' }, ['Session Stats'])]);

    const stats = h('div', { className: 'grid grid-cols-2 gap-2' }, [
      this.createStatItem('Messages', messageCount || 0),
      this.createStatItem('Duration', formatDuration(duration)),
      this.createStatItem('User', eventCounts.user),
      this.createStatItem('Assistant', eventCounts.assistant),
      this.createStatItem('Tool Calls', eventCounts.tool),
      this.createStatItem('Events', (events || []).length)
    ]);

    section.appendChild(stats);

    return section;
  }

  /**
   * Create a stat item
   * @param {string} label
   * @param {string|number} value
   * @returns {HTMLElement}
   */
  createStatItem(label, value) {
    return h('div', { className: 'p-2 bg-gray-800 rounded' }, [h('div', { className: 'text-xs text-gray-500' }, [label]), h('div', { className: 'text-sm text-gray-200 font-medium' }, [String(value)])]);
  }

  /**
   * Create technical info section
   * @returns {HTMLElement}
   */
  createTechnicalSection() {
    const { id, filePath, projectName, createdAt, updatedAt } = this.session;

    const section = h('div', { className: 'p-3' }, [h('h4', { className: 'text-xs font-medium text-gray-500 uppercase mb-2' }, ['Details'])]);

    const items = [
      { label: 'Project', value: projectName || 'Unknown' },
      { label: 'Started', value: formatDateTime(createdAt) },
      { label: 'Last Updated', value: formatDateTime(updatedAt) },
      { label: 'Session ID', value: id ? id.slice(0, 8) + '...' : 'N/A' }
    ];

    const list = h(
      'div',
      { className: 'space-y-2' },
      items.map((item) =>
        h('div', { className: 'text-sm' }, [h('span', { className: 'text-gray-500' }, [item.label + ': ']), h('span', { className: 'text-gray-300' }, [item.value])])
      )
    );

    section.appendChild(list);

    // File path (truncated)
    if (filePath) {
      const pathEl = h('div', { className: 'mt-2 text-xs text-gray-500 truncate', title: filePath }, [filePath]);
      section.appendChild(pathEl);
    }

    return section;
  }

  /**
   * Set session data
   * @param {Session} session
   */
  setSession(session) {
    this.session = session;
    this.render();
  }

  /**
   * Clear session data
   */
  clear() {
    this.session = null;
    this.render();
  }

  /**
   * Toggle collapse state
   */
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.render();
  }

  /**
   * Cleanup
   */
  destroy() {
    this.removeAllListeners();
    clearChildren(this.container);
  }
}

export default MetadataPanel;
