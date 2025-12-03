/**
 * KeyboardManager
 * Handles global keyboard shortcuts and navigation
 */

import { EventEmitter } from './EventEmitter.js';

/**
 * @typedef {Object} ShortcutConfig
 * @property {string} key - The key to listen for
 * @property {boolean} [ctrl] - Requires Ctrl/Cmd
 * @property {boolean} [shift] - Requires Shift
 * @property {boolean} [alt] - Requires Alt/Option
 * @property {string} [when] - Context when shortcut is active
 */

export class KeyboardManager extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, { config: ShortcutConfig, handler: Function }>} */
    this.shortcuts = new Map();
    /** @type {string} */
    this.currentContext = 'default';
    /** @type {boolean} */
    this.enabled = true;

    this.init();
  }

  init() {
    this.keydownHandler = (e) => this.handleKeydown(e);
    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} e
   */
  handleKeydown(e) {
    if (!this.enabled) return;

    // Skip if typing in input fields
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow some shortcuts even in inputs
      if (!this.isGlobalShortcut(e)) return;
    }

    const shortcutKey = this.getShortcutKey(e);
    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut) {
      const { config, handler } = shortcut;
      // Check context
      if (!config.when || config.when === this.currentContext || config.when === 'always') {
        e.preventDefault();
        handler(e);
      }
    }

    // Emit generic key events for list navigation
    if (this.currentContext === 'session-list') {
      this.handleListNavigation(e);
    }
  }

  /**
   * Check if this is a global shortcut that works in inputs
   * @param {KeyboardEvent} e
   * @returns {boolean}
   */
  isGlobalShortcut(e) {
    const isMod = e.metaKey || e.ctrlKey;
    // Cmd+K (search), Cmd+F (find), Escape
    return (isMod && (e.key === 'k' || e.key === 'f')) || e.key === 'Escape';
  }

  /**
   * Handle list navigation keys
   * @param {KeyboardEvent} e
   */
  handleListNavigation(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.emit('navigate', { direction: 'down' });
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.emit('navigate', { direction: 'up' });
        break;
      case 'Enter':
        e.preventDefault();
        this.emit('select');
        break;
      case 'Home':
        e.preventDefault();
        this.emit('navigate', { direction: 'first' });
        break;
      case 'End':
        e.preventDefault();
        this.emit('navigate', { direction: 'last' });
        break;
    }
  }

  /**
   * Generate shortcut key string
   * @param {KeyboardEvent} e
   * @returns {string}
   */
  getShortcutKey(e) {
    const parts = [];
    if (e.metaKey || e.ctrlKey) parts.push('mod');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Register a keyboard shortcut
   * @param {string} id - Unique identifier
   * @param {ShortcutConfig} config
   * @param {Function} handler
   */
  register(id, config, handler) {
    const shortcutKey = this.buildShortcutKey(config);
    this.shortcuts.set(shortcutKey, { config, handler });
  }

  /**
   * Build shortcut key from config
   * @param {ShortcutConfig} config
   * @returns {string}
   */
  buildShortcutKey(config) {
    const parts = [];
    if (config.ctrl) parts.push('mod');
    if (config.shift) parts.push('shift');
    if (config.alt) parts.push('alt');
    parts.push(config.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Unregister a shortcut
   * @param {string} id
   */
  unregister(id) {
    // Find and remove by iterating (not ideal but simple)
    for (const [key, value] of this.shortcuts) {
      if (value.config.id === id) {
        this.shortcuts.delete(key);
        break;
      }
    }
  }

  /**
   * Set current context
   * @param {string} context
   */
  setContext(context) {
    this.currentContext = context;
    this.emit('context-change', { context });
  }

  /**
   * Enable/disable keyboard handling
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Get registered shortcuts for display
   * @returns {Array<{ key: string, description: string }>}
   */
  getShortcuts() {
    const result = [];
    for (const [key, { config }] of this.shortcuts) {
      if (config.description) {
        result.push({
          key: this.formatShortcutDisplay(config),
          description: config.description
        });
      }
    }
    return result;
  }

  /**
   * Format shortcut for display
   * @param {ShortcutConfig} config
   * @returns {string}
   */
  formatShortcutDisplay(config) {
    const isMac = navigator.platform.includes('Mac');
    const parts = [];
    if (config.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
    if (config.shift) parts.push(isMac ? '⇧' : 'Shift');
    if (config.alt) parts.push(isMac ? '⌥' : 'Alt');
    parts.push(config.key.toUpperCase());
    return parts.join(isMac ? '' : '+');
  }

  /**
   * Cleanup
   */
  destroy() {
    document.removeEventListener('keydown', this.keydownHandler);
    this.shortcuts.clear();
    this.removeAllListeners();
  }
}

export default KeyboardManager;
