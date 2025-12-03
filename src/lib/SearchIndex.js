/**
 * SearchIndex - In-memory search indexing for session metadata
 * Provides fast keyword search across session summaries and content
 */

import { EventEmitter } from './EventEmitter.js';

/**
 * @typedef {import('../types/session').SessionSummary} SessionSummary
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} sessionId - Session ID
 * @property {number} score - Relevance score (higher = better match)
 * @property {string[]} matchedFields - Fields that matched the query
 */

/**
 * @typedef {Object} SearchOptions
 * @property {string} [projectName] - Filter by project name
 * @property {number} [dateFrom] - Filter sessions created after timestamp
 * @property {number} [dateTo] - Filter sessions created before timestamp
 * @property {string} [sortBy='date'] - Sort field: 'date', 'project', 'duration', 'tokens'
 * @property {'asc'|'desc'} [sortOrder='desc'] - Sort order
 * @property {number} [limit] - Max results to return
 */

export class SearchIndex extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, SessionSummary>} */
    this.sessions = new Map();
    /** @type {Map<string, Set<string>>} */
    this.wordIndex = new Map(); // word -> Set of sessionIds
    /** @type {Map<string, Set<string>>} */
    this.projectIndex = new Map(); // project -> Set of sessionIds
    /** @type {boolean} */
    this.isReady = false;
  }

  /**
   * Add a session to the index
   * @param {SessionSummary} session
   */
  addSession(session) {
    const id = session.id;
    this.sessions.set(id, session);

    // Index by project
    if (session.projectName) {
      if (!this.projectIndex.has(session.projectName)) {
        this.projectIndex.set(session.projectName, new Set());
      }
      this.projectIndex.get(session.projectName).add(id);
    }

    // Index words from summary
    this.indexText(session.summary || '', id);
    this.indexText(session.projectName || '', id);
  }

  /**
   * Index text content for a session
   * @param {string} text
   * @param {string} sessionId
   */
  indexText(text, sessionId) {
    const words = this.tokenize(text);
    for (const word of words) {
      if (!this.wordIndex.has(word)) {
        this.wordIndex.set(word, new Set());
      }
      this.wordIndex.get(word).add(sessionId);
    }
  }

  /**
   * Tokenize text into searchable words
   * @param {string} text
   * @returns {string[]}
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ') // Replace non-word chars with spaces
      .split(/\s+/)
      .filter((word) => word.length >= 2); // Min 2 chars
  }

  /**
   * Remove a session from the index
   * @param {string} sessionId
   */
  removeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Remove from project index
    if (session.projectName && this.projectIndex.has(session.projectName)) {
      this.projectIndex.get(session.projectName).delete(sessionId);
    }

    // Remove from word index
    for (const [word, sessionIds] of this.wordIndex) {
      sessionIds.delete(sessionId);
      if (sessionIds.size === 0) {
        this.wordIndex.delete(word);
      }
    }

    this.sessions.delete(sessionId);
  }

  /**
   * Clear the entire index
   */
  clear() {
    this.sessions.clear();
    this.wordIndex.clear();
    this.projectIndex.clear();
    this.isReady = false;
  }

  /**
   * Search sessions by keyword
   * @param {string} query - Search query
   * @param {SearchOptions} [options={}] - Search options
   * @returns {SearchResult[]}
   */
  search(query, options = {}) {
    const startTime = performance.now();

    // Get base results
    let results;
    if (query && query.trim()) {
      results = this.searchByKeyword(query);
    } else {
      // No query - return all sessions
      results = Array.from(this.sessions.keys()).map((id) => ({
        sessionId: id,
        score: 1,
        matchedFields: []
      }));
    }

    // Apply filters
    results = this.applyFilters(results, options);

    // Sort results
    results = this.sortResults(results, options.sortBy || 'date', options.sortOrder || 'desc');

    // Apply limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    const duration = performance.now() - startTime;
    this.emit('search', { query, resultCount: results.length, duration });

    return results;
  }

  /**
   * Search by keyword across indexed fields
   * @param {string} query
   * @returns {SearchResult[]}
   */
  searchByKeyword(query) {
    const queryWords = this.tokenize(query);
    if (queryWords.length === 0) {
      return Array.from(this.sessions.keys()).map((id) => ({
        sessionId: id,
        score: 1,
        matchedFields: []
      }));
    }

    // Find sessions matching any word
    /** @type {Map<string, {score: number, matchedFields: Set<string>}>} */
    const scoreMap = new Map();

    for (const word of queryWords) {
      // Exact match
      if (this.wordIndex.has(word)) {
        for (const sessionId of this.wordIndex.get(word)) {
          if (!scoreMap.has(sessionId)) {
            scoreMap.set(sessionId, { score: 0, matchedFields: new Set() });
          }
          const entry = scoreMap.get(sessionId);
          entry.score += 2; // Exact match bonus
          entry.matchedFields.add('keyword');
        }
      }

      // Prefix match
      for (const [indexedWord, sessionIds] of this.wordIndex) {
        if (indexedWord.startsWith(word) && indexedWord !== word) {
          for (const sessionId of sessionIds) {
            if (!scoreMap.has(sessionId)) {
              scoreMap.set(sessionId, { score: 0, matchedFields: new Set() });
            }
            const entry = scoreMap.get(sessionId);
            entry.score += 1; // Prefix match
            entry.matchedFields.add('keyword');
          }
        }
      }
    }

    return Array.from(scoreMap.entries()).map(([sessionId, data]) => ({
      sessionId,
      score: data.score,
      matchedFields: Array.from(data.matchedFields)
    }));
  }

  /**
   * Apply filters to search results
   * @param {SearchResult[]} results
   * @param {SearchOptions} options
   * @returns {SearchResult[]}
   */
  applyFilters(results, options) {
    return results.filter((result) => {
      const session = this.sessions.get(result.sessionId);
      if (!session) return false;

      // Project filter
      if (options.projectName && session.projectName !== options.projectName) {
        return false;
      }

      // Date range filter (uses updatedAt for more intuitive "recent activity" filtering)
      if (options.dateFrom && session.updatedAt < options.dateFrom) {
        return false;
      }
      if (options.dateTo && session.updatedAt > options.dateTo) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort search results
   * @param {SearchResult[]} results
   * @param {string} sortBy
   * @param {'asc'|'desc'} sortOrder
   * @returns {SearchResult[]}
   */
  sortResults(results, sortBy, sortOrder) {
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return results.sort((a, b) => {
      const sessionA = this.sessions.get(a.sessionId);
      const sessionB = this.sessions.get(b.sessionId);

      if (!sessionA || !sessionB) return 0;

      switch (sortBy) {
        case 'date':
          return multiplier * (sessionA.createdAt - sessionB.createdAt);
        case 'project':
          return multiplier * (sessionA.projectName || '').localeCompare(sessionB.projectName || '');
        case 'duration':
          const durationA = sessionA.updatedAt - sessionA.createdAt;
          const durationB = sessionB.updatedAt - sessionB.createdAt;
          return multiplier * (durationA - durationB);
        case 'tokens':
          const tokensA = sessionA.tokenUsage ? sessionA.tokenUsage.input + sessionA.tokenUsage.output : 0;
          const tokensB = sessionB.tokenUsage ? sessionB.tokenUsage.input + sessionB.tokenUsage.output : 0;
          return multiplier * (tokensA - tokensB);
        case 'score':
          return multiplier * (a.score - b.score);
        default:
          return 0;
      }
    });
  }

  /**
   * Get all unique project names
   * @returns {string[]}
   */
  getProjects() {
    return Array.from(this.projectIndex.keys()).sort();
  }

  /**
   * Get session by ID
   * @param {string} sessionId
   * @returns {SessionSummary|undefined}
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions (for listing)
   * @returns {SessionSummary[]}
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Get index statistics
   * @returns {{sessionCount: number, wordCount: number, projectCount: number}}
   */
  getStats() {
    return {
      sessionCount: this.sessions.size,
      wordCount: this.wordIndex.size,
      projectCount: this.projectIndex.size
    };
  }

  /**
   * Bulk add sessions (more efficient than individual adds)
   * @param {SessionSummary[]} sessions
   */
  addSessions(sessions) {
    for (const session of sessions) {
      this.addSession(session);
    }
    this.isReady = true;
    this.emit('ready', this.getStats());
  }
}

export default SearchIndex;
