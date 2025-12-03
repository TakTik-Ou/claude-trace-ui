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
    /** @type {boolean} */
    this.groupByProject = true; // Group sessions by project
    /** @type {HTMLElement|null} */
    this.sessionCountEl = null;
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
    // Session count and refresh button (search is handled by app-level SearchBar)
    const sessionCount = h('span', { className: 'session-count text-xs text-gray-500' }, ['0 sessions']);
    this.sessionCountEl = sessionCount;

    // Group toggle button
    const groupToggle = h(
      'button',
      {
        className: 'group-toggle-btn p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200',
        onClick: () => {
          this.groupByProject = !this.groupByProject;
          this.renderList();
        },
        title: 'Toggle project grouping'
      },
      [
        h('svg', { className: 'w-4 h-4', viewBox: '0 0 20 20', fill: 'currentColor' }, [
          h('path', {
            fillRule: 'evenodd',
            d: 'M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z',
            clipRule: 'evenodd'
          })
        ])
      ]
    );

    // Refresh button
    const refreshBtn = h(
      'button',
      {
        className: 'refresh-btn p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200',
        onClick: () => this.emit('refresh'),
        title: 'Refresh sessions'
      },
      [
        h('svg', { className: 'w-4 h-4', viewBox: '0 0 20 20', fill: 'currentColor' }, [
          h('path', {
            fillRule: 'evenodd',
            d: 'M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z',
            clipRule: 'evenodd'
          })
        ])
      ]
    );

    return h('div', { className: 'session-list-header px-4 py-2 border-b border-gray-700 flex items-center justify-between' }, [
      sessionCount,
      h('div', { className: 'flex items-center gap-1' }, [groupToggle, refreshBtn])
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
   * Apply filter and render
   * Note: Filtering/sorting is now handled by SearchIndex at app level
   * This method just updates the display with pre-filtered sessions
   */
  applyFilter() {
    // Sessions are pre-filtered by SearchIndex, just use them directly
    this.filteredSessions = [...this.sessions];

    // Update session count
    if (this.sessionCountEl) {
      this.sessionCountEl.textContent = `${this.filteredSessions.length} session${this.filteredSessions.length !== 1 ? 's' : ''}`;
    }

    // Render list
    this.renderList();

    this.emit('filter', { count: this.filteredSessions.length, total: this.sessions.length });
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
