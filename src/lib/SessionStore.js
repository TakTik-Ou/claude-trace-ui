/**
 * SessionStore - State container for session data
 * Manages session summaries, full sessions, and search/filter state
 */

import { EventEmitter } from './EventEmitter.js';

/**
 * @typedef {import('../types/session').SessionSummary} SessionSummary
 * @typedef {import('../types/session').Session} Session
 */

/**
 * @typedef {Object} FilterState
 * @property {string} searchQuery - Search text
 * @property {string | null} projectPath - Filter by project
 * @property {[number, number] | null} dateRange - Filter by date range [start, end]
 * @property {'date' | 'project' | 'duration' | 'tokens'} sortField - Sort field
 * @property {'asc' | 'desc'} sortDirection - Sort direction
 */

/**
 * Store events
 * @typedef {'sessions:loaded' | 'sessions:updated' | 'session:selected' | 'filter:changed' | 'loading:start' | 'loading:end' | 'error'} StoreEvent
 */

export class SessionStore extends EventEmitter {
  /** @type {SessionSummary[]} */
  #sessions = [];

  /** @type {SessionSummary[]} */
  #filteredSessions = [];

  /** @type {Map<string, Session>} */
  #sessionCache = new Map();

  /** @type {string | null} */
  #selectedSessionId = null;

  /** @type {FilterState} */
  #filterState = {
    searchQuery: '',
    projectPath: null,
    dateRange: null,
    sortField: 'date',
    sortDirection: 'desc'
  };

  /** @type {boolean} */
  #loading = false;

  /** @type {Set<string>} */
  #projectPaths = new Set();

  /**
   * Create a new SessionStore
   */
  constructor() {
    super();
  }

  // =========================================================================
  // Getters
  // =========================================================================

  /**
   * Get all session summaries
   * @returns {SessionSummary[]}
   */
  getSessions() {
    return this.#sessions;
  }

  /**
   * Get filtered session summaries
   * @returns {SessionSummary[]}
   */
  getFilteredSessions() {
    return this.#filteredSessions;
  }

  /**
   * Get unique project paths
   * @returns {string[]}
   */
  getProjectPaths() {
    return Array.from(this.#projectPaths);
  }

  /**
   * Get the selected session ID
   * @returns {string | null}
   */
  getSelectedSessionId() {
    return this.#selectedSessionId;
  }

  /**
   * Get current filter state
   * @returns {FilterState}
   */
  getFilterState() {
    return { ...this.#filterState };
  }

  /**
   * Get loading state
   * @returns {boolean}
   */
  isLoading() {
    return this.#loading;
  }

  /**
   * Get a cached full session
   * @param {string} uuid - Session UUID
   * @returns {Session | undefined}
   */
  getCachedSession(uuid) {
    return this.#sessionCache.get(uuid);
  }

  // =========================================================================
  // Actions
  // =========================================================================

  /**
   * Set session summaries
   * @param {SessionSummary[]} sessions
   */
  setSessions(sessions) {
    this.#sessions = sessions;

    // Extract unique project paths
    this.#projectPaths.clear();
    sessions.forEach((s) => this.#projectPaths.add(s.projectPath));

    this.#applyFilters();
    this.emit('sessions:loaded', this.#filteredSessions);
  }

  /**
   * Cache a full session
   * @param {Session} session
   */
  cacheSession(session) {
    // LRU cache - keep max 10 sessions
    if (this.#sessionCache.size >= 10) {
      const firstKey = this.#sessionCache.keys().next().value;
      this.#sessionCache.delete(firstKey);
    }
    this.#sessionCache.set(session.uuid, session);
  }

  /**
   * Select a session
   * @param {string | null} uuid - Session UUID or null to deselect
   */
  selectSession(uuid) {
    if (this.#selectedSessionId !== uuid) {
      this.#selectedSessionId = uuid;
      this.emit('session:selected', uuid);
    }
  }

  /**
   * Update filter state
   * @param {Partial<FilterState>} updates
   */
  setFilter(updates) {
    this.#filterState = { ...this.#filterState, ...updates };
    this.#applyFilters();
    this.emit('filter:changed', this.#filterState);
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.#filterState = {
      searchQuery: '',
      projectPath: null,
      dateRange: null,
      sortField: 'date',
      sortDirection: 'desc'
    };
    this.#applyFilters();
    this.emit('filter:changed', this.#filterState);
  }

  /**
   * Set loading state
   * @param {boolean} loading
   */
  setLoading(loading) {
    this.#loading = loading;
    this.emit(loading ? 'loading:start' : 'loading:end');
  }

  // =========================================================================
  // Private methods
  // =========================================================================

  /**
   * Apply current filters to sessions
   */
  #applyFilters() {
    let filtered = [...this.#sessions];

    // Search filter
    if (this.#filterState.searchQuery) {
      const query = this.#filterState.searchQuery.toLowerCase();
      filtered = filtered.filter((s) =>
        s.summary.toLowerCase().includes(query) ||
        s.projectName.toLowerCase().includes(query)
      );
    }

    // Project filter
    if (this.#filterState.projectPath) {
      filtered = filtered.filter((s) => s.projectPath === this.#filterState.projectPath);
    }

    // Date range filter
    if (this.#filterState.dateRange) {
      const [start, end] = this.#filterState.dateRange;
      filtered = filtered.filter((s) => s.createdAt >= start && s.createdAt <= end);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (this.#filterState.sortField) {
        case 'date':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'project':
          comparison = a.projectName.localeCompare(b.projectName);
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'tokens':
          comparison = a.totalTokens - b.totalTokens;
          break;
      }
      return this.#filterState.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.#filteredSessions = filtered;
    this.emit('sessions:updated', this.#filteredSessions);
  }
}

// Singleton instance
export const sessionStore = new SessionStore();

export default SessionStore;
