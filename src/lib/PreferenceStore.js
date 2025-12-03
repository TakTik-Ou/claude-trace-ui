/**
 * PreferenceStore
 * Manages user preferences in localStorage with graceful error handling
 */

export class PreferenceStore {
  constructor() {
    this.storageKey = 'claudeTraceUI.preferences';
    this.preferences = this.load();
  }

  /**
   * Load preferences from localStorage
   * @returns {Object} Preferences object
   */
  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
      return {};
    }
  }

  /**
   * Save preferences to localStorage
   * @returns {boolean} Success status
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
      return true;
    } catch (error) {
      // Handle quota exceeded and other storage errors
      if (error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Cannot save preferences.');
      } else {
        console.error('Failed to save preferences to localStorage:', error);
      }
      return false;
    }
  }

  /**
   * Get expanded groups as a Set
   * @returns {Set<string>} Set of expanded group names
   */
  getExpandedGroups() {
    try {
      const groups = this.preferences.expandedGroups || [];
      return new Set(groups);
    } catch (error) {
      console.warn('Failed to get expanded groups:', error);
      return new Set();
    }
  }

  /**
   * Set expanded groups from a Set
   * @param {Set<string>} groupsSet Set of expanded group names
   * @returns {boolean} Success status
   */
  setExpandedGroups(groupsSet) {
    try {
      this.preferences.expandedGroups = Array.from(groupsSet);
      return this.save();
    } catch (error) {
      console.error('Failed to set expanded groups:', error);
      return false;
    }
  }

  /**
   * Get a preference value
   * @param {string} key Preference key
   * @param {*} defaultValue Default value if key not found
   * @returns {*} Preference value
   */
  get(key, defaultValue = null) {
    return this.preferences.hasOwnProperty(key) ? this.preferences[key] : defaultValue;
  }

  /**
   * Set a preference value
   * @param {string} key Preference key
   * @param {*} value Preference value
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      this.preferences[key] = value;
      return this.save();
    } catch (error) {
      console.error(`Failed to set preference '${key}':`, error);
      return false;
    }
  }

  /**
   * Clear all preferences
   * @returns {boolean} Success status
   */
  clear() {
    try {
      this.preferences = {};
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  static isAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default PreferenceStore;
