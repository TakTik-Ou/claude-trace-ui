/**
 * ErrorBoundary Component
 * Displays errors gracefully with retry option
 */

import { h, clearChildren } from '../utils/dom-helpers.js';
import { EventEmitter } from '../lib/EventEmitter.js';

/**
 * @typedef {Object} ErrorInfo
 * @property {string} message - Error message
 * @property {string} [code] - Error code
 * @property {string} [stack] - Stack trace
 * @property {boolean} [recoverable] - Can retry
 */

export class ErrorBoundary extends EventEmitter {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super();
    this.container = container;
    /** @type {ErrorInfo|null} */
    this.error = null;
    this.visible = false;

    this.element = this.createErrorElement();
    this.container.appendChild(this.element);
    this.hide();
  }

  /**
   * Create error display element
   * @returns {HTMLElement}
   */
  createErrorElement() {
    // Error icon
    const icon = h('div', { className: 'error-icon text-4xl mb-4' }, ['⚠️']);

    // Title
    this.titleEl = h('h3', { className: 'error-title text-lg font-semibold text-red-400 mb-2' }, ['Something went wrong']);

    // Message
    this.messageEl = h('p', { className: 'error-message text-gray-400 mb-4 max-w-md text-center' }, ['An unexpected error occurred.']);

    // Error code (optional)
    this.codeEl = h('code', { className: 'error-code text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded mb-4 hidden' }, ['']);

    // Stack trace (collapsible, dev only)
    this.stackContainer = h('details', { className: 'error-stack w-full max-w-lg mb-4 hidden' }, [
      h('summary', { className: 'text-xs text-gray-500 cursor-pointer hover:text-gray-400' }, ['Technical details']),
      (this.stackEl = h('pre', { className: 'mt-2 p-2 bg-gray-800 rounded text-xs text-gray-400 overflow-auto max-h-32' }, ['']))
    ]);

    // Action buttons
    const retryBtn = h(
      'button',
      {
        className: 'retry-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium',
        onClick: () => this.handleRetry()
      },
      ['Try Again']
    );

    const dismissBtn = h(
      'button',
      {
        className: 'dismiss-btn px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm ml-2',
        onClick: () => this.hide()
      },
      ['Dismiss']
    );

    this.actionsEl = h('div', { className: 'error-actions flex gap-2' }, [retryBtn, dismissBtn]);

    // Container
    return h('div', { className: 'error-boundary absolute inset-0 bg-gray-900/95 z-50 flex flex-col items-center justify-center p-6' }, [
      icon,
      this.titleEl,
      this.messageEl,
      this.codeEl,
      this.stackContainer,
      this.actionsEl
    ]);
  }

  /**
   * Show error
   * @param {Error|ErrorInfo|string} error
   */
  show(error) {
    this.visible = true;
    this.element.style.display = 'flex';

    // Normalize error
    if (typeof error === 'string') {
      this.error = { message: error, recoverable: true };
    } else if (error instanceof Error) {
      this.error = {
        message: error.message,
        code: error.name,
        stack: error.stack,
        recoverable: true
      };
    } else {
      this.error = { recoverable: true, ...error };
    }

    this.render();
  }

  /**
   * Hide error display
   */
  hide() {
    this.visible = false;
    this.element.style.display = 'none';
    this.error = null;
    this.emit('dismiss');
  }

  /**
   * Render error content
   */
  render() {
    if (!this.error) return;

    const { message, code, stack, recoverable } = this.error;

    // Update message
    this.messageEl.textContent = message;

    // Update code if present
    if (code) {
      this.codeEl.textContent = code;
      this.codeEl.classList.remove('hidden');
    } else {
      this.codeEl.classList.add('hidden');
    }

    // Update stack trace (only in dev)
    if (stack && this.isDev()) {
      this.stackEl.textContent = stack;
      this.stackContainer.classList.remove('hidden');
    } else {
      this.stackContainer.classList.add('hidden');
    }

    // Update retry button visibility
    const retryBtn = this.actionsEl.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.style.display = recoverable ? '' : 'none';
    }
  }

  /**
   * Handle retry button click
   */
  handleRetry() {
    this.hide();
    this.emit('retry');
  }

  /**
   * Check if in development mode
   * @returns {boolean}
   */
  isDev() {
    return window.location.hostname === 'localhost' || window.location.protocol === 'file:';
  }

  /**
   * Show as inline error (not overlay)
   * @param {HTMLElement} targetContainer
   * @param {string} message
   * @returns {HTMLElement}
   */
  static createInlineError(targetContainer, message) {
    const errorEl = h('div', { className: 'inline-error p-4 bg-red-900/30 border border-red-800 rounded-lg' }, [
      h('div', { className: 'flex items-center gap-2' }, [
        h('span', { className: 'text-red-400' }, ['⚠']),
        h('span', { className: 'text-red-400 text-sm' }, [message])
      ])
    ]);

    clearChildren(targetContainer);
    targetContainer.appendChild(errorEl);
    return errorEl;
  }

  /**
   * Check if visible
   * @returns {boolean}
   */
  isVisible() {
    return this.visible;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.removeAllListeners();
    this.element.remove();
  }
}

export default ErrorBoundary;
