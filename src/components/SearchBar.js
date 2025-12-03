/**
 * SearchBar Component
 * Global search bar for searching across all sessions
 */

import { h, clearChildren } from '../utils/dom-helpers.js';
import { EventEmitter } from '../lib/EventEmitter.js';

export class SearchBar extends EventEmitter {
  /**
   * @param {HTMLElement} container
   * @param {Object} [options]
   * @param {string} [options.placeholder='Search sessions...']
   * @param {number} [options.debounceMs=200] - Debounce delay for search
   */
  constructor(container, options = {}) {
    super();
    this.container = container;
    this.options = {
      placeholder: 'Search sessions...',
      debounceMs: 200,
      ...options
    };
    /** @type {string} */
    this.query = '';
    /** @type {number|null} */
    this.debounceTimer = null;

    this.init();
  }

  init() {
    this.render();
    this.setupKeyboardShortcuts();
  }

  render() {
    clearChildren(this.container);

    // Search icon
    const searchIcon = h(
      'svg',
      {
        className: 'search-icon w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none',
        viewBox: '0 0 20 20',
        fill: 'currentColor'
      },
      [
        h('path', {
          fillRule: 'evenodd',
          d: 'M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z',
          clipRule: 'evenodd'
        })
      ]
    );

    // Search input
    this.searchInput = h('input', {
      type: 'text',
      placeholder: this.options.placeholder,
      className: 'search-input w-full pl-10 pr-8 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
      onInput: (e) => this.handleInput(e.target.value),
      onKeydown: (e) => this.handleKeydown(e)
    });

    // Clear button
    this.clearBtn = h(
      'button',
      {
        className: 'clear-btn absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 hidden',
        onClick: () => this.clear(),
        title: 'Clear search'
      },
      [
        h(
          'svg',
          {
            className: 'w-4 h-4',
            viewBox: '0 0 20 20',
            fill: 'currentColor'
          },
          [
            h('path', {
              fillRule: 'evenodd',
              d: 'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z',
              clipRule: 'evenodd'
            })
          ]
        )
      ]
    );

    // Keyboard shortcut hint
    this.shortcutHint = h('span', { className: 'shortcut-hint absolute right-8 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none' }, ['⌘K']);

    // Container
    const wrapper = h('div', { className: 'search-bar-wrapper relative' }, [searchIcon, this.searchInput, this.clearBtn, this.shortcutHint]);

    this.container.appendChild(wrapper);
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    this.keydownHandler = (e) => {
      // Cmd+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.focus();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Handle input change with debounce
   * @param {string} value
   */
  handleInput(value) {
    this.query = value.trim();

    // Update UI
    this.clearBtn.classList.toggle('hidden', !this.query);
    this.shortcutHint.classList.toggle('hidden', !!this.query);

    // Debounce search
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.emit('search', { query: this.query });
    }, this.options.debounceMs);
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} e
   */
  handleKeydown(e) {
    if (e.key === 'Escape') {
      if (this.query) {
        this.clear();
      } else {
        this.blur();
      }
    } else if (e.key === 'Enter') {
      // Immediate search on Enter
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.emit('search', { query: this.query });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.emit('navigate', { direction: 'down' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.emit('navigate', { direction: 'up' });
    }
  }

  /**
   * Clear search
   */
  clear() {
    this.query = '';
    this.searchInput.value = '';
    this.clearBtn.classList.add('hidden');
    this.shortcutHint.classList.remove('hidden');

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.emit('clear');
    this.emit('search', { query: '' });
  }

  /**
   * Focus search input
   */
  focus() {
    this.searchInput.focus();
    this.searchInput.select();
  }

  /**
   * Blur search input
   */
  blur() {
    this.searchInput.blur();
  }

  /**
   * Set search value programmatically
   * @param {string} value
   */
  setValue(value) {
    this.query = value;
    this.searchInput.value = value;
    this.clearBtn.classList.toggle('hidden', !value);
    this.shortcutHint.classList.toggle('hidden', !!value);
  }

  /**
   * Get current query
   * @returns {string}
   */
  getValue() {
    return this.query;
  }

  /**
   * Cleanup
   */
  destroy() {
    document.removeEventListener('keydown', this.keydownHandler);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.removeAllListeners();
    clearChildren(this.container);
  }
}

export default SearchBar;
