/**
 * InSessionSearch Component
 * Search within session messages with highlighting and navigation
 */

import { h, clearChildren, toggleClass } from '../utils/dom-helpers.js';
import { EventEmitter } from '../lib/EventEmitter.js';

/**
 * @typedef {Object} SearchMatch
 * @property {number} index - Match index
 * @property {string} messageId - ID of the message containing match
 * @property {number} startPos - Start position in text
 * @property {number} endPos - End position in text
 * @property {string} context - Surrounding text context
 */

export class InSessionSearch extends EventEmitter {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super();
    this.container = container;
    /** @type {string} */
    this.query = '';
    /** @type {SearchMatch[]} */
    this.matches = [];
    /** @type {number} */
    this.currentMatchIndex = -1;
    /** @type {boolean} */
    this.isOpen = false;

    this.init();
  }

  init() {
    this.element = this.render();
    this.container.appendChild(this.element);
    this.hide();
    this.setupKeyboardShortcuts();
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    // Search input
    this.searchInput = h('input', {
      type: 'text',
      placeholder: 'Search in session...',
      className: 'search-input flex-1 px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-l text-sm focus:outline-none focus:border-blue-500',
      onInput: (e) => this.handleSearch(e.target.value),
      onKeydown: (e) => this.handleKeydown(e)
    });

    // Match counter
    this.matchCounter = h('span', { className: 'match-counter px-2 py-1.5 bg-gray-800 border-y border-gray-600 text-xs text-gray-400 min-w-16 text-center' }, ['0/0']);

    // Navigation buttons
    const prevBtn = h(
      'button',
      {
        className: 'nav-btn px-2 py-1.5 bg-gray-800 border border-gray-600 hover:bg-gray-700 text-sm',
        onClick: () => this.navigatePrev(),
        title: 'Previous match (Shift+Enter)'
      },
      ['↑']
    );

    const nextBtn = h(
      'button',
      {
        className: 'nav-btn px-2 py-1.5 bg-gray-800 border-l-0 border border-gray-600 hover:bg-gray-700 text-sm',
        onClick: () => this.navigateNext(),
        title: 'Next match (Enter)'
      },
      ['↓']
    );

    // Close button
    const closeBtn = h(
      'button',
      {
        className: 'close-btn px-2 py-1.5 bg-gray-800 border border-l-0 border-gray-600 rounded-r hover:bg-gray-700 text-sm',
        onClick: () => this.hide(),
        title: 'Close (Escape)'
      },
      ['×']
    );

    // Search bar container
    const searchBar = h('div', { className: 'in-session-search flex items-center bg-gray-900 border-b border-gray-700 p-2' }, [
      this.searchInput,
      this.matchCounter,
      prevBtn,
      nextBtn,
      closeBtn
    ]);

    return searchBar;
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    // Global Cmd+F to open search
    this.keydownHandler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        this.show();
      }
      // Cmd+G / Shift+Cmd+G for next/prev
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          this.navigatePrev();
        } else {
          this.navigateNext();
        }
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Handle search input
   * @param {string} query
   */
  handleSearch(query) {
    this.query = query.trim();

    if (!this.query) {
      this.clearMatches();
      return;
    }

    this.emit('search', { query: this.query });
  }

  /**
   * Handle keydown in search input
   * @param {KeyboardEvent} e
   */
  handleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        this.navigatePrev();
      } else {
        this.navigateNext();
      }
    } else if (e.key === 'Escape') {
      this.hide();
    }
  }

  /**
   * Set search matches
   * @param {SearchMatch[]} matches
   */
  setMatches(matches) {
    this.matches = matches;
    this.currentMatchIndex = matches.length > 0 ? 0 : -1;
    this.updateCounter();

    if (this.currentMatchIndex >= 0) {
      this.emit('navigate', { match: this.matches[this.currentMatchIndex], index: this.currentMatchIndex });
    }
  }

  /**
   * Clear all matches
   */
  clearMatches() {
    this.matches = [];
    this.currentMatchIndex = -1;
    this.updateCounter();
    this.emit('clear');
  }

  /**
   * Navigate to next match
   */
  navigateNext() {
    if (this.matches.length === 0) return;

    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length;
    this.updateCounter();
    this.emit('navigate', { match: this.matches[this.currentMatchIndex], index: this.currentMatchIndex });
  }

  /**
   * Navigate to previous match
   */
  navigatePrev() {
    if (this.matches.length === 0) return;

    this.currentMatchIndex = this.currentMatchIndex <= 0 ? this.matches.length - 1 : this.currentMatchIndex - 1;
    this.updateCounter();
    this.emit('navigate', { match: this.matches[this.currentMatchIndex], index: this.currentMatchIndex });
  }

  /**
   * Update match counter display
   */
  updateCounter() {
    if (this.matches.length === 0) {
      this.matchCounter.textContent = this.query ? 'No matches' : '0/0';
      this.matchCounter.className = 'match-counter px-2 py-1.5 bg-gray-800 border-y border-gray-600 text-xs text-gray-400 min-w-16 text-center';
    } else {
      this.matchCounter.textContent = `${this.currentMatchIndex + 1}/${this.matches.length}`;
      this.matchCounter.className = 'match-counter px-2 py-1.5 bg-gray-800 border-y border-gray-600 text-xs text-green-400 min-w-16 text-center';
    }
  }

  /**
   * Show search bar
   */
  show() {
    this.isOpen = true;
    this.element.style.display = 'flex';
    this.searchInput.focus();
    this.searchInput.select();
  }

  /**
   * Hide search bar
   */
  hide() {
    this.isOpen = false;
    this.element.style.display = 'none';
    this.clearMatches();
    this.query = '';
    this.searchInput.value = '';
    this.emit('close');
  }

  /**
   * Check if search is open
   * @returns {boolean}
   */
  isVisible() {
    return this.isOpen;
  }

  /**
   * Get current query
   * @returns {string}
   */
  getQuery() {
    return this.query;
  }

  /**
   * Cleanup
   */
  destroy() {
    document.removeEventListener('keydown', this.keydownHandler);
    this.removeAllListeners();
    this.element.remove();
  }
}

/**
 * Highlight text matches in a string
 * @param {string} text - Original text
 * @param {string} query - Search query
 * @param {string} [highlightClass='bg-yellow-500/30'] - CSS class for highlights
 * @returns {string} HTML with highlights (safe - escapes text first)
 */
export function highlightMatches(text, query, highlightClass = 'bg-yellow-500/30') {
  if (!query || !text) return escapeHtml(text);

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const escaped = escapeHtml(text);

  return escaped.replace(regex, `<mark class="${highlightClass} rounded px-0.5">$1</mark>`);
}

/**
 * Escape HTML special characters
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Find all matches of query in text
 * @param {string} text - Text to search
 * @param {string} query - Search query
 * @param {string} messageId - Message ID for context
 * @returns {SearchMatch[]}
 */
export function findMatches(text, query, messageId) {
  if (!query || !text) return [];

  const matches = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let pos = 0;
  let index = 0;

  while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
    // Get context (50 chars before and after)
    const contextStart = Math.max(0, pos - 50);
    const contextEnd = Math.min(text.length, pos + query.length + 50);
    const context = (contextStart > 0 ? '...' : '') + text.slice(contextStart, contextEnd) + (contextEnd < text.length ? '...' : '');

    matches.push({
      index: index++,
      messageId,
      startPos: pos,
      endPos: pos + query.length,
      context
    });

    pos += query.length;
  }

  return matches;
}

export default InSessionSearch;
