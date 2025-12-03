/**
 * SessionList Component
 * Displays a virtualized list of session summaries with filtering
 */

import { h, clearChildren, toggleClass } from '../utils/dom-helpers.js';
import { formatRelativeTime, formatDuration } from '../utils/date-formatter.js';
import { EventEmitter } from '../lib/EventEmitter.js';

/**
 * @typedef {import('../types/session').SessionSummary} SessionSummary
 */

const ITEM_HEIGHT = 72; // px per session item
const GROUP_HEADER_HEIGHT = 40; // px per group header

export class SessionList extends EventEmitter {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super();
    this.container = container;
    /** @type {SessionSummary[]} */
    this.sessions = [];
    /** @type {SessionSummary[]} */
    this.filteredSessions = [];
    /** @type {string|null} */
    this.selectedId = null;
    /** @type {string} */
    this.filterText = '';
    /** @type {string} */
    this.sortBy = 'date'; // 'date' | 'name' | 'project'
    /** @type {boolean} */
    this.sortAsc = false;
    /** @type {boolean} */
    this.groupByProject = true; // New: group by project
    /** @type {Set<string>} */
    this.collapsedGroups = new Set(); // Track collapsed project groups

    this.init();
  }

  init() {
    // Create header with search and sort
    const header = this.createHeader();
    this.container.appendChild(header);

    // Create list container - needs min-h-0 for flex overflow to work
    this.listContainer = h('div', {
      className: 'session-list-container flex-1 min-h-0 overflow-y-auto'
    });
    this.container.appendChild(this.listContainer);

    // Empty state
    this.emptyState = h(
      'div',
      { className: 'empty-state p-8 text-center text-gray-500' },
      [h('p', { className: 'text-lg mb-2' }, ['No sessions found']), h('p', { className: 'text-sm' }, ['Sessions will appear here once you use Claude Code'])]
    );
  }

  createHeader() {
    // Search input
    const searchInput = h('input', {
      type: 'text',
      placeholder: 'Search sessions...',
      className: 'search-input w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500',
      onInput: (e) => {
        this.filterText = e.target.value;
        this.applyFilter();
      }
    });

    // Sort dropdown
    const sortSelect = h(
      'select',
      {
        className: 'sort-select px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm',
        onChange: (e) => {
          this.sortBy = e.target.value;
          this.applyFilter();
        }
      },
      [h('option', { value: 'date' }, ['Date']), h('option', { value: 'name' }, ['Name']), h('option', { value: 'project' }, ['Project'])]
    );

    // Sort direction button
    const sortDirBtn = h(
      'button',
      {
        className: 'sort-dir-btn p-1 hover:bg-gray-700 rounded',
        onClick: () => {
          this.sortAsc = !this.sortAsc;
          sortDirBtn.textContent = this.sortAsc ? '↑' : '↓';
          this.applyFilter();
        }
      },
      ['↓']
    );

    // Refresh button
    const refreshBtn = h(
      'button',
      {
        className: 'refresh-btn px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm',
        onClick: () => this.emit('refresh')
      },
      ['Refresh']
    );

    return h('div', { className: 'session-list-header p-4 border-b border-gray-700' }, [
      h('div', { className: 'mb-3' }, [searchInput]),
      h('div', { className: 'flex items-center gap-2' }, [h('span', { className: 'text-xs text-gray-500' }, ['Sort:']), sortSelect, sortDirBtn, h('div', { className: 'flex-1' }), refreshBtn])
    ]);
  }

  /**
   * @param {SessionSummary} session
   * @returns {HTMLElement}
   */
  renderSessionItem(session) {
    const isSelected = session.uuid === this.selectedId;

    const item = h(
      'div',
      {
        className: `session-item p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${isSelected ? 'bg-gray-800 border-l-2 border-l-blue-500' : ''} ${this.groupByProject ? 'pl-6' : ''}`,
        dataSessionId: session.uuid,
        onClick: () => this.selectSession(session)
      },
      [
        // Title row
        h('div', { className: 'flex items-center gap-2 mb-1' }, [
          h('span', { className: 'text-sm font-medium text-gray-100 truncate flex-1' }, [session.summary || 'Untitled Session']),
          h('span', { className: 'text-xs text-gray-500' }, [formatRelativeTime(session.updatedAt)])
        ]),
        // Project row (only show if not grouped)
        !this.groupByProject ? h('div', { className: 'flex items-center gap-2 mb-1' }, [h('span', { className: 'text-xs text-blue-400 truncate' }, [session.projectName])]) : null,
        // Stats row
        h('div', { className: 'flex items-center gap-3 text-xs text-gray-500' }, [
          h('span', {}, [`${session.messageCount} messages`]),
          h('span', {}, [formatDuration(session.duration)]),
          session.totalTokens > 0 ? h('span', {}, [`${Math.round(session.totalTokens / 1000)}k tokens`]) : null
        ].filter(Boolean))
      ].filter(Boolean)
    );

    return item;
  }

  /**
   * Set sessions data
   * @param {SessionSummary[]} sessions
   */
  setSessions(sessions) {
    this.sessions = sessions;
    this.applyFilter();
  }

  /**
   * Apply filter and sort
   */
  applyFilter() {
    let filtered = [...this.sessions];

    // Filter by search text
    if (this.filterText) {
      const search = this.filterText.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.summary.toLowerCase().includes(search) ||
          s.projectName.toLowerCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (this.sortBy) {
        case 'date':
          cmp = b.updatedAt - a.updatedAt;
          break;
        case 'name':
          cmp = a.summary.localeCompare(b.summary);
          break;
        case 'project':
          cmp = a.projectName.localeCompare(b.projectName);
          break;
      }
      return this.sortAsc ? -cmp : cmp;
    });

    this.filteredSessions = filtered;

    // Render list
    this.renderList();

    this.emit('filter', { count: filtered.length, total: this.sessions.length });
  }

  /**
   * Render the session list (grouped or flat)
   */
  renderList() {
    clearChildren(this.listContainer);

    if (this.filteredSessions.length === 0) {
      this.listContainer.appendChild(this.emptyState);
      return;
    }

    if (this.groupByProject) {
      this.renderGroupedList();
    } else {
      this.renderFlatList();
    }
  }

  /**
   * Render sessions grouped by project
   */
  renderGroupedList() {
    // Group sessions by project
    const groups = new Map();
    for (const session of this.filteredSessions) {
      const projectName = session.projectName || 'Unknown Project';
      if (!groups.has(projectName)) {
        groups.set(projectName, []);
      }
      groups.get(projectName).push(session);
    }

    // Sort groups by most recent session
    const sortedGroups = [...groups.entries()].sort((a, b) => {
      const aLatest = Math.max(...a[1].map(s => s.updatedAt));
      const bLatest = Math.max(...b[1].map(s => s.updatedAt));
      return bLatest - aLatest;
    });

    // Render each group
    for (const [projectName, sessions] of sortedGroups) {
      const isCollapsed = this.collapsedGroups.has(projectName);

      // Group header
      const header = h(
        'div',
        {
          className: 'group-header sticky top-0 bg-gray-900 border-b border-gray-700 px-3 py-2 cursor-pointer hover:bg-gray-800 flex items-center gap-2 z-10',
          onClick: () => this.toggleGroup(projectName)
        },
        [
          h('span', { className: 'text-gray-400 text-sm' }, [isCollapsed ? '▶' : '▼']),
          h('span', { className: 'text-blue-400 font-medium text-sm flex-1 truncate' }, [projectName]),
          h('span', { className: 'text-gray-500 text-xs' }, [`${sessions.length} session${sessions.length !== 1 ? 's' : ''}`])
        ]
      );
      this.listContainer.appendChild(header);

      // Sessions in this group (if not collapsed)
      if (!isCollapsed) {
        for (const session of sessions) {
          const item = this.renderSessionItem(session);
          this.listContainer.appendChild(item);
        }
      }
    }
  }

  /**
   * Render sessions as flat list
   */
  renderFlatList() {
    for (const session of this.filteredSessions) {
      const item = this.renderSessionItem(session);
      this.listContainer.appendChild(item);
    }
  }

  /**
   * Toggle a project group collapsed state
   * @param {string} projectName
   */
  toggleGroup(projectName) {
    if (this.collapsedGroups.has(projectName)) {
      this.collapsedGroups.delete(projectName);
    } else {
      this.collapsedGroups.add(projectName);
    }
    this.renderList();
  }

  /**
   * Select a session
   * @param {SessionSummary} session
   */
  selectSession(session) {
    this.selectedId = session.uuid;
    this.renderList();
    this.emit('select', session);
  }

  /**
   * Navigate to next/previous session
   * @param {'up' | 'down' | 'first' | 'last'} direction
   */
  navigate(direction) {
    if (this.filteredSessions.length === 0) return;

    const currentIndex = this.filteredSessions.findIndex((s) => s.uuid === this.selectedId);
    let newIndex;

    switch (direction) {
      case 'up':
        newIndex = currentIndex <= 0 ? this.filteredSessions.length - 1 : currentIndex - 1;
        break;
      case 'down':
        newIndex = currentIndex >= this.filteredSessions.length - 1 ? 0 : currentIndex + 1;
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = this.filteredSessions.length - 1;
        break;
      default:
        return;
    }

    const session = this.filteredSessions[newIndex];
    if (session) {
      this.selectedId = session.uuid;
      this.renderList();
      this.scrollToSelected();
      this.emit('highlight', session);
    }
  }

  /**
   * Confirm selection of highlighted item
   */
  confirmSelection() {
    const session = this.filteredSessions.find((s) => s.uuid === this.selectedId);
    if (session) {
      this.emit('select', session);
    }
  }

  /**
   * Scroll to keep selected item in view
   */
  scrollToSelected() {
    if (!this.selectedId) return;
    const item = this.listContainer.querySelector(`[data-session-id="${this.selectedId}"]`);
    if (item) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Get current selection
   * @returns {SessionSummary|null}
   */
  getSelected() {
    return this.filteredSessions.find((s) => s.uuid === this.selectedId) || null;
  }

  /**
   * Show loading state
   * @param {boolean} loading
   */
  setLoading(loading) {
    toggleClass(this.container, 'opacity-50', loading);
    toggleClass(this.container, 'pointer-events-none', loading);
  }

  /**
   * Update scan progress
   * @param {{currentPath: string, sessionsFound: number, progress: number}} progress
   */
  setProgress(progress) {
    // Could show progress bar here
    this.emit('progress', progress);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.removeAllListeners();
    clearChildren(this.container);
  }
}

export default SessionList;
