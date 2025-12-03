/**
 * Preferences Service
 * Manages user preferences with localStorage persistence
 */

import { EventEmitter } from '../lib/EventEmitter.js';

const STORAGE_KEY = 'claude-trace-ui-preferences';

/**
 * @typedef {Object} Preferences
 * @property {string} theme - 'dark' or 'light' or 'system'
 * @property {string} sortBy - 'date' | 'project' | 'duration' | 'tokens'
 * @property {string} sortOrder - 'asc' | 'desc'
 * @property {boolean} showOutline - Show session outline
 * @property {boolean} showMetadata - Show metadata panel
 * @property {number} sidebarWidth - Sidebar width in pixels
 * @property {string[]} recentProjects - Recently accessed projects
 * @property {Object} exportOptions - Last used export options
 */

/** @type {Preferences} */
const DEFAULT_PREFERENCES = {
  theme: 'dark',
  sortBy: 'date',
  sortOrder: 'desc',
  showOutline: true,
  showMetadata: true,
  sidebarWidth: 320,
  recentProjects: [],
  exportOptions: {
    includeToolOutputs: true,
    includeSyntaxHighlighting: true,
    includeMetadata: true,
    theme: 'dark'
  }
};

class PreferencesService extends EventEmitter {
  constructor() {
    super();
    /** @type {Preferences} */
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.load();
  }

  /**
   * Load preferences from storage
   */
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load preferences:', e);
    }
  }

  /**
   * Save preferences to storage
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (e) {
      console.warn('Failed to save preferences:', e);
    }
  }

  /**
   * Get a preference value
   * @template {keyof Preferences} K
   * @param {K} key
   * @returns {Preferences[K]}
   */
  get(key) {
    return this.preferences[key];
  }

  /**
   * Set a preference value
   * @template {keyof Preferences} K
   * @param {K} key
   * @param {Preferences[K]} value
   */
  set(key, value) {
    const oldValue = this.preferences[key];
    this.preferences[key] = value;
    this.save();
    this.emit('change', { key, value, oldValue });
    this.emit(`change:${key}`, { value, oldValue });
  }

  /**
   * Get all preferences
   * @returns {Preferences}
   */
  getAll() {
    return { ...this.preferences };
  }

  /**
   * Update multiple preferences
   * @param {Partial<Preferences>} updates
   */
  update(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this.preferences[key] = value;
    }
    this.save();
    this.emit('change', { updates });
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.save();
    this.emit('reset');
  }

  /**
   * Add a project to recent list
   * @param {string} projectName
   */
  addRecentProject(projectName) {
    const recent = this.preferences.recentProjects.filter((p) => p !== projectName);
    recent.unshift(projectName);
    this.preferences.recentProjects = recent.slice(0, 10); // Keep last 10
    this.save();
  }

  /**
   * Get recent projects
   * @returns {string[]}
   */
  getRecentProjects() {
    return [...this.preferences.recentProjects];
  }

  /**
   * Apply theme to document
   */
  applyTheme() {
    const theme = this.preferences.theme;
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }

  /**
   * Setup system theme listener
   */
  setupThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.preferences.theme === 'system') {
        this.applyTheme();
      }
    });
  }
}

// Export singleton instance
export const preferences = new PreferencesService();
export default preferences;
