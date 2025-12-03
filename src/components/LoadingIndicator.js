/**
 * LoadingIndicator Component
 * Shows loading state with optional progress
 */

import { h, toggleClass } from '../utils/dom-helpers.js';

/**
 * @typedef {Object} LoadingOptions
 * @property {string} [message] - Loading message
 * @property {boolean} [showProgress] - Show progress bar
 * @property {boolean} [overlay] - Show as overlay
 */

export class LoadingIndicator {
  /**
   * @param {HTMLElement} container
   * @param {LoadingOptions} [options]
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      message: 'Loading...',
      showProgress: false,
      overlay: false,
      ...options
    };
    this.visible = false;
    this.progress = 0;

    this.element = this.render();
    this.container.appendChild(this.element);
    this.hide();
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const { message, showProgress, overlay } = this.options;

    // Spinner
    const spinner = h('div', { className: 'loading-spinner w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin' });

    // Message
    this.messageEl = h('p', { className: 'loading-message mt-3 text-sm text-gray-400' }, [message]);

    // Progress bar (optional)
    this.progressContainer = h('div', { className: `progress-container mt-3 w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden ${showProgress ? '' : 'hidden'}` }, [
      (this.progressBar = h('div', { className: 'progress-bar h-full bg-blue-500 transition-all duration-300', style: { width: '0%' } }))
    ]);

    // Progress text
    this.progressText = h('p', { className: `progress-text mt-1 text-xs text-gray-500 ${showProgress ? '' : 'hidden'}` }, ['0%']);

    // Inner content
    const content = h('div', { className: 'loading-content flex flex-col items-center justify-center p-6' }, [spinner, this.messageEl, this.progressContainer, this.progressText]);

    // Wrapper
    const wrapper = h(
      'div',
      {
        className: `loading-indicator ${overlay ? 'absolute inset-0 bg-gray-900/80 z-50' : ''} flex items-center justify-center`
      },
      [content]
    );

    return wrapper;
  }

  /**
   * Show the loading indicator
   * @param {string} [message]
   */
  show(message) {
    this.visible = true;
    this.element.style.display = 'flex';
    if (message) {
      this.setMessage(message);
    }
  }

  /**
   * Hide the loading indicator
   */
  hide() {
    this.visible = false;
    this.element.style.display = 'none';
  }

  /**
   * Set message text
   * @param {string} message
   */
  setMessage(message) {
    this.messageEl.textContent = message;
  }

  /**
   * Set progress value
   * @param {number} percent - 0-100
   * @param {string} [message]
   */
  setProgress(percent, message) {
    this.progress = Math.max(0, Math.min(100, percent));
    this.progressBar.style.width = `${this.progress}%`;
    this.progressText.textContent = `${Math.round(this.progress)}%`;

    if (message) {
      this.setMessage(message);
    }
  }

  /**
   * Show/hide progress bar
   * @param {boolean} show
   */
  showProgress(show) {
    toggleClass(this.progressContainer, 'hidden', !show);
    toggleClass(this.progressText, 'hidden', !show);
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
    this.element.remove();
  }
}

/**
 * Create a simple inline spinner
 * @param {string} [size='sm'] - 'sm' | 'md' | 'lg'
 * @returns {HTMLElement}
 */
export function createSpinner(size = 'sm') {
  const sizes = {
    sm: 'w-4 h-4 border',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2'
  };

  return h('div', {
    className: `inline-block ${sizes[size] || sizes.sm} border-gray-600 border-t-blue-500 rounded-full animate-spin`
  });
}

/**
 * Create a skeleton loader
 * @param {string} [width='100%']
 * @param {string} [height='1rem']
 * @returns {HTMLElement}
 */
export function createSkeleton(width = '100%', height = '1rem') {
  return h('div', {
    className: 'skeleton bg-gray-700 rounded animate-pulse',
    style: { width, height }
  });
}

export default LoadingIndicator;
