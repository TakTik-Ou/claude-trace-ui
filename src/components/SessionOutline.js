/**
 * SessionOutline Component
 * Provides session overview with jump-to navigation by message type
 */

import { h, clearChildren, toggleClass } from '../utils/dom-helpers.js';
import { formatTime } from '../utils/date-formatter.js';
import { EventEmitter } from '../lib/EventEmitter.js';

/**
 * @typedef {Object} OutlineItem
 * @property {string} id - Message/event ID
 * @property {string} type - Event type (user, assistant, tool_use, etc.)
 * @property {string} preview - Short preview text
 * @property {number} timestamp - Event timestamp
 * @property {number} index - Position in message list
 */

// Type icons and colors
const TYPE_CONFIG = {
  user: { icon: '👤', color: 'text-blue-400', label: 'User' },
  assistant: { icon: '🤖', color: 'text-green-400', label: 'Assistant' },
  tool_use: { icon: '🔧', color: 'text-yellow-400', label: 'Tool' },
  tool_result: { icon: '📋', color: 'text-purple-400', label: 'Result' },
  summary: { icon: '📝', color: 'text-cyan-400', label: 'Summary' },
  system: { icon: '⚙️', color: 'text-gray-400', label: 'System' }
};

export class SessionOutline extends EventEmitter {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super();
    this.container = container;
    /** @type {OutlineItem[]} */
    this.items = [];
    /** @type {Set<string>} */
    this.visibleTypes = new Set(['user', 'assistant', 'tool_use']);
    /** @type {string|null} */
    this.selectedId = null;
    /** @type {boolean} */
    this.isCollapsed = false;

    this.init();
  }

  init() {
    this.container.className = 'session-outline flex flex-col h-full bg-gray-900 border-l border-gray-700';
    this.render();
  }

  render() {
    clearChildren(this.container);

    // Header with toggle
    const header = this.createHeader();
    this.container.appendChild(header);

    // Type filters
    this.filtersEl = this.createFilters();
    this.container.appendChild(this.filtersEl);

    // Outline list
    this.listEl = h('div', { className: 'outline-list flex-1 overflow-y-auto' });
    this.container.appendChild(this.listEl);

    // Stats footer
    this.statsEl = h('div', { className: 'outline-stats px-3 py-2 border-t border-gray-700 text-xs text-gray-500' });
    this.container.appendChild(this.statsEl);

    this.renderItems();
  }

  /**
   * Create header with collapse toggle
   * @returns {HTMLElement}
   */
  createHeader() {
    const toggleBtn = h(
      'button',
      {
        className: 'toggle-btn p-1 hover:bg-gray-700 rounded',
        onClick: () => this.toggleCollapse(),
        title: 'Toggle outline'
      },
      [this.isCollapsed ? '◀' : '▶']
    );

    return h('div', { className: 'outline-header flex items-center justify-between px-3 py-2 border-b border-gray-700' }, [
      h('span', { className: 'text-sm font-medium text-gray-300' }, ['Outline']),
      toggleBtn
    ]);
  }

  /**
   * Create type filter buttons
   * @returns {HTMLElement}
   */
  createFilters() {
    const filters = h('div', { className: 'outline-filters flex flex-wrap gap-1 px-2 py-2 border-b border-gray-700' });

    const types = ['user', 'assistant', 'tool_use'];

    for (const type of types) {
      const config = TYPE_CONFIG[type] || TYPE_CONFIG.system;
      const isActive = this.visibleTypes.has(type);

      const btn = h(
        'button',
        {
          className: `filter-btn px-2 py-0.5 text-xs rounded ${isActive ? 'bg-gray-700 ' + config.color : 'bg-gray-800 text-gray-500'}`,
          dataType: type,
          onClick: () => this.toggleTypeFilter(type)
        },
        [config.icon + ' ' + config.label]
      );

      filters.appendChild(btn);
    }

    return filters;
  }

  /**
   * Set outline items from session events
   * @param {Array<{type: string, data: any, timestamp: number}>} events
   */
  setEvents(events) {
    this.items = events
      .filter((e) => ['user', 'assistant', 'tool_use'].includes(e.type))
      .map((event, index) => ({
        id: event.data?.uuid || String(event.timestamp),
        type: event.type,
        preview: this.getPreview(event),
        timestamp: event.timestamp,
        index
      }));

    this.renderItems();
    this.updateStats();
  }

  /**
   * Get preview text from event
   * @param {Object} event
   * @returns {string}
   */
  getPreview(event) {
    const content = event.data?.content || event.data?.message || '';

    if (typeof content === 'string') {
      return content.slice(0, 60) + (content.length > 60 ? '...' : '');
    }

    if (Array.isArray(content)) {
      const textBlock = content.find((b) => b.type === 'text');
      if (textBlock) {
        return textBlock.text.slice(0, 60) + (textBlock.text.length > 60 ? '...' : '');
      }
    }

    if (event.type === 'tool_use' && event.data?.name) {
      return `Tool: ${event.data.name}`;
    }

    return 'No preview';
  }

  /**
   * Render outline items
   */
  renderItems() {
    clearChildren(this.listEl);

    const filteredItems = this.items.filter((item) => this.visibleTypes.has(item.type));

    if (filteredItems.length === 0) {
      this.listEl.appendChild(h('div', { className: 'p-4 text-center text-gray-500 text-sm' }, ['No items to show']));
      return;
    }

    for (const item of filteredItems) {
      const itemEl = this.createOutlineItem(item);
      this.listEl.appendChild(itemEl);
    }
  }

  /**
   * Create outline item element
   * @param {OutlineItem} item
   * @returns {HTMLElement}
   */
  createOutlineItem(item) {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
    const isSelected = item.id === this.selectedId;

    return h(
      'div',
      {
        className: `outline-item px-3 py-2 cursor-pointer hover:bg-gray-800 border-l-2 ${isSelected ? 'border-l-blue-500 bg-gray-800' : 'border-l-transparent'}`,
        dataItemId: item.id,
        onClick: () => this.selectItem(item)
      },
      [
        h('div', { className: 'flex items-center gap-2 mb-1' }, [
          h('span', { className: 'text-xs' }, [config.icon]),
          h('span', { className: `text-xs font-medium ${config.color}` }, [config.label]),
          h('span', { className: 'text-xs text-gray-500 ml-auto' }, [formatTime(item.timestamp)])
        ]),
        h('div', { className: 'text-xs text-gray-400 truncate' }, [item.preview])
      ]
    );
  }

  /**
   * Toggle type filter
   * @param {string} type
   */
  toggleTypeFilter(type) {
    if (this.visibleTypes.has(type)) {
      this.visibleTypes.delete(type);
    } else {
      this.visibleTypes.add(type);
    }

    // Update filter button styles
    const buttons = this.filtersEl.querySelectorAll('.filter-btn');
    buttons.forEach((btn) => {
      const btnType = btn.dataset.type;
      const config = TYPE_CONFIG[btnType] || TYPE_CONFIG.system;
      const isActive = this.visibleTypes.has(btnType);
      btn.className = `filter-btn px-2 py-0.5 text-xs rounded ${isActive ? 'bg-gray-700 ' + config.color : 'bg-gray-800 text-gray-500'}`;
    });

    this.renderItems();
  }

  /**
   * Select an outline item
   * @param {OutlineItem} item
   */
  selectItem(item) {
    this.selectedId = item.id;
    this.renderItems();
    this.emit('select', item);
  }

  /**
   * Toggle collapse state
   */
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.container.style.width = this.isCollapsed ? '40px' : '250px';
    toggleClass(this.filtersEl, 'hidden', this.isCollapsed);
    toggleClass(this.listEl, 'hidden', this.isCollapsed);
    toggleClass(this.statsEl, 'hidden', this.isCollapsed);
    this.render();
  }

  /**
   * Update stats footer
   */
  updateStats() {
    const userCount = this.items.filter((i) => i.type === 'user').length;
    const assistantCount = this.items.filter((i) => i.type === 'assistant').length;
    const toolCount = this.items.filter((i) => i.type === 'tool_use').length;

    this.statsEl.textContent = `${userCount} user · ${assistantCount} assistant · ${toolCount} tools`;
  }

  /**
   * Highlight item by ID
   * @param {string} id
   */
  highlightItem(id) {
    this.selectedId = id;
    this.renderItems();

    // Scroll to item
    const itemEl = this.listEl.querySelector(`[data-item-id="${id}"]`);
    if (itemEl) {
      itemEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.removeAllListeners();
    clearChildren(this.container);
  }
}

export default SessionOutline;
