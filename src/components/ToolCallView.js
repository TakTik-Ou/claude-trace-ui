/**
 * ToolCallView Component
 * Renders a tool call with expandable input/output
 */

import { h, toggleClass } from '../utils/dom-helpers.js';
import { highlightCode } from '../services/syntax-highlighter.js';

/**
 * @typedef {import('../types/event').ToolCall} ToolCall
 */

// Tool icons/badges
const TOOL_STYLES = {
  Read: { icon: '📄', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  Write: { icon: '✏️', color: 'text-green-400', bg: 'bg-green-900/30' },
  Edit: { icon: '🔧', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  Bash: { icon: '💻', color: 'text-purple-400', bg: 'bg-purple-900/30' },
  Glob: { icon: '🔍', color: 'text-cyan-400', bg: 'bg-cyan-900/30' },
  Grep: { icon: '🔎', color: 'text-cyan-400', bg: 'bg-cyan-900/30' },
  Task: { icon: '📋', color: 'text-orange-400', bg: 'bg-orange-900/30' },
  WebFetch: { icon: '🌐', color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
  WebSearch: { icon: '🔍', color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
  default: { icon: '⚡', color: 'text-gray-400', bg: 'bg-gray-800' }
};

export class ToolCallView {
  /**
   * @param {ToolCall} toolCall
   */
  constructor(toolCall) {
    this.toolCall = toolCall;
    this.expanded = false;
    this.element = this.render();
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const { name, input, output, status } = this.toolCall;

    // Get style for this tool
    const style = TOOL_STYLES[name] || TOOL_STYLES.default;

    // Create header
    const header = h(
      'div',
      {
        className: 'tool-call-header flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-700 rounded-t',
        onClick: () => this.toggleExpand()
      },
      [
        h('span', { className: 'text-sm' }, [style.icon]),
        h('span', { className: `text-sm font-medium ${style.color}` }, [name]),
        this.renderInputSummary(input),
        h('div', { className: 'flex-1' }),
        status ? this.renderStatus(status) : null,
        h('span', { className: 'expand-icon text-gray-500 text-xs' }, ['▶'])
      ].filter(Boolean)
    );

    // Create expandable content
    const content = h('div', { className: 'tool-call-content hidden' }, [
      this.renderInput(input),
      output ? this.renderOutput(output) : null
    ].filter(Boolean));

    // Container
    const container = h('div', { className: `tool-call rounded border border-gray-700 ${style.bg} text-sm`, dataToolId: this.toolCall.id }, [header, content]);

    this.headerEl = header;
    this.contentEl = content;
    this.expandIcon = header.querySelector('.expand-icon');

    return container;
  }

  /**
   * Render brief input summary in header
   * @param {Object} input
   * @returns {HTMLElement}
   */
  renderInputSummary(input) {
    if (!input) return h('span', {}, []);

    let summary = '';

    // Extract key info based on tool type
    if (input.file_path) {
      summary = this.truncatePath(input.file_path);
    } else if (input.command) {
      summary = this.truncate(input.command, 40);
    } else if (input.pattern) {
      summary = `"${this.truncate(input.pattern, 30)}"`;
    } else if (input.query) {
      summary = this.truncate(input.query, 40);
    } else if (input.url) {
      summary = this.truncateUrl(input.url);
    }

    return h('span', { className: 'text-xs text-gray-500 truncate max-w-xs' }, [summary]);
  }

  /**
   * Render input details
   * @param {Object} input
   * @returns {HTMLElement}
   */
  renderInput(input) {
    if (!input) return null;

    const formatted = JSON.stringify(input, null, 2);
    const highlighted = highlightCode(formatted, 'json');

    const inputEl = h('div', { className: 'tool-input p-2 border-t border-gray-700' }, [
      h('div', { className: 'text-xs text-gray-500 mb-1' }, ['Input:']),
      h('pre', { className: 'text-xs overflow-x-auto' })
    ]);

    inputEl.querySelector('pre').innerHTML = highlighted;

    return inputEl;
  }

  /**
   * Render output details
   * @param {*} output
   * @returns {HTMLElement}
   */
  renderOutput(output) {
    let formatted;
    let lang = 'plaintext';

    if (typeof output === 'string') {
      formatted = output;
    } else {
      formatted = JSON.stringify(output, null, 2);
      lang = 'json';
    }

    // Truncate very long outputs
    const truncated = formatted.length > 2000;
    const displayText = truncated ? formatted.slice(0, 2000) + '\n... (truncated)' : formatted;

    const highlighted = highlightCode(displayText, lang);

    const outputEl = h('div', { className: 'tool-output p-2 border-t border-gray-700' }, [
      h('div', { className: 'text-xs text-gray-500 mb-1' }, ['Output:']),
      h('pre', { className: 'text-xs overflow-x-auto max-h-64 overflow-y-auto' })
    ]);

    outputEl.querySelector('pre').innerHTML = highlighted;

    return outputEl;
  }

  /**
   * Render status badge
   * @param {string} status
   * @returns {HTMLElement}
   */
  renderStatus(status) {
    const styles = {
      success: 'bg-green-900 text-green-400',
      error: 'bg-red-900 text-red-400',
      pending: 'bg-yellow-900 text-yellow-400'
    };

    return h('span', { className: `text-xs px-1.5 py-0.5 rounded ${styles[status] || styles.pending}` }, [status]);
  }

  /**
   * Toggle expand/collapse
   */
  toggleExpand() {
    this.expanded = !this.expanded;
    toggleClass(this.contentEl, 'hidden', !this.expanded);
    if (this.expandIcon) {
      this.expandIcon.textContent = this.expanded ? '▼' : '▶';
    }
  }

  /**
   * Truncate string
   * @param {string} str
   * @param {number} max
   * @returns {string}
   */
  truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '...' : str;
  }

  /**
   * Truncate file path (show filename + parent)
   * @param {string} filePath
   * @returns {string}
   */
  truncatePath(filePath) {
    if (!filePath) return '';
    const parts = filePath.split('/');
    if (parts.length <= 2) return filePath;
    return '.../' + parts.slice(-2).join('/');
  }

  /**
   * Truncate URL (show domain + path start)
   * @param {string} url
   * @returns {string}
   */
  truncateUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      return u.hostname + this.truncate(u.pathname, 20);
    } catch {
      return this.truncate(url, 40);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    // No listeners to clean up
  }
}

export default ToolCallView;
