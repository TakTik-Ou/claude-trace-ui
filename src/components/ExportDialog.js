/**
 * ExportDialog Component
 * Dialog for exporting session(s) to HTML with options
 */

import { h, clearChildren } from '../utils/dom-helpers.js';
import { EventEmitter } from '../lib/EventEmitter.js';
import { exportSessionToHtml, generateExportFilename } from '../services/html-exporter.js';

/**
 * @typedef {import('../types/session').Session} Session
 */

/**
 * @typedef {Object} ExportOptions
 * @property {boolean} includeToolOutputs - Include tool call outputs
 * @property {boolean} includeSyntaxHighlighting - Enable syntax highlighting
 * @property {boolean} includeMetadata - Include session metadata
 * @property {string} theme - Color theme: 'dark' or 'light'
 */

export class ExportDialog extends EventEmitter {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super();
    this.container = container;
    /** @type {Session|null} */
    this.session = null;
    /** @type {Session[]} */
    this.sessions = [];
    /** @type {boolean} */
    this.isOpen = false;
    /** @type {boolean} */
    this.isExporting = false;
    /** @type {ExportOptions} */
    this.options = {
      includeToolOutputs: true,
      includeSyntaxHighlighting: true,
      includeMetadata: true,
      theme: 'dark'
    };

    this.init();
  }

  init() {
    this.render();
    this.setupKeyboardShortcuts();
  }

  render() {
    clearChildren(this.container);

    // Backdrop
    this.backdrop = h('div', {
      className: 'export-dialog-backdrop fixed inset-0 bg-black/50 z-40 hidden',
      onClick: (e) => {
        if (e.target === this.backdrop) this.close();
      }
    });

    // Dialog
    this.dialog = h('div', {
      className: 'export-dialog fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-900 rounded-lg shadow-xl z-50 hidden',
      role: 'dialog',
      ariaModal: 'true'
    });

    this.container.appendChild(this.backdrop);
    this.container.appendChild(this.dialog);
  }

  /**
   * Render dialog content
   */
  renderContent() {
    clearChildren(this.dialog);

    const isBatch = this.sessions.length > 1;
    const title = isBatch ? `Export ${this.sessions.length} Sessions` : 'Export Session';

    // Header
    const header = h('div', { className: 'flex items-center justify-between p-4 border-b border-gray-700' }, [
      h('h2', { className: 'text-lg font-semibold text-gray-100' }, [title]),
      h(
        'button',
        {
          className: 'text-gray-400 hover:text-gray-200 p-1',
          onClick: () => this.close(),
          ariaLabel: 'Close'
        },
        ['×']
      )
    ]);

    // Options section
    const optionsSection = h('div', { className: 'p-4 space-y-4' }, [this.createCheckbox('includeMetadata', 'Include session metadata', 'Start time, duration, token count'), this.createCheckbox('includeToolOutputs', 'Include tool outputs', 'Show full tool call results'), this.createThemeSelector()]);

    // Preview info
    const previewInfo = h('div', { className: 'px-4 pb-4' }, [
      h('div', { className: 'p-3 bg-gray-800 rounded text-sm text-gray-400' }, [
        isBatch ? `${this.sessions.length} files will be created` : `File: ${generateExportFilename(this.session)}`
      ])
    ]);

    // Footer with actions
    const footer = h('div', { className: 'flex justify-end gap-2 p-4 border-t border-gray-700' }, [
      h(
        'button',
        {
          className: 'px-4 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded',
          onClick: () => this.close()
        },
        ['Cancel']
      ),
      h(
        'button',
        {
          className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center gap-2',
          onClick: () => this.handleExport(),
          disabled: this.isExporting
        },
        [this.isExporting ? 'Exporting...' : 'Export HTML']
      )
    ]);

    this.dialog.appendChild(header);
    this.dialog.appendChild(optionsSection);
    this.dialog.appendChild(previewInfo);
    this.dialog.appendChild(footer);
  }

  /**
   * Create a checkbox option
   * @param {keyof ExportOptions} key
   * @param {string} label
   * @param {string} description
   * @returns {HTMLElement}
   */
  createCheckbox(key, label, description) {
    const id = `export-opt-${key}`;
    const isChecked = this.options[key];

    const checkbox = h('input', {
      type: 'checkbox',
      id,
      className: 'w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500',
      checked: isChecked,
      onChange: (e) => {
        this.options[key] = e.target.checked;
      }
    });

    return h('label', { className: 'flex items-start gap-3 cursor-pointer', htmlFor: id }, [
      checkbox,
      h('div', {}, [h('div', { className: 'text-gray-200 text-sm' }, [label]), h('div', { className: 'text-gray-500 text-xs' }, [description])])
    ]);
  }

  /**
   * Create theme selector
   * @returns {HTMLElement}
   */
  createThemeSelector() {
    return h('div', { className: 'flex items-center gap-3' }, [
      h('span', { className: 'text-gray-200 text-sm' }, ['Theme:']),
      h(
        'select',
        {
          className: 'px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500',
          onChange: (e) => {
            this.options.theme = e.target.value;
          }
        },
        [
          h('option', { value: 'dark', selected: this.options.theme === 'dark' }, ['Dark']),
          h('option', { value: 'light', selected: this.options.theme === 'light' }, ['Light'])
        ]
      )
    ]);
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    this.keydownHandler = (e) => {
      if (!this.isOpen) return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        this.handleExport();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Open dialog for single session
   * @param {Session} session
   */
  openForSession(session) {
    this.session = session;
    this.sessions = [session];
    this.open();
  }

  /**
   * Open dialog for batch export
   * @param {Session[]} sessions
   */
  openForBatch(sessions) {
    this.session = sessions[0];
    this.sessions = sessions;
    this.open();
  }

  /**
   * Open the dialog
   */
  open() {
    this.isOpen = true;
    this.isExporting = false;
    this.renderContent();
    this.backdrop.classList.remove('hidden');
    this.dialog.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    this.emit('open');
  }

  /**
   * Close the dialog
   */
  close() {
    this.isOpen = false;
    this.backdrop.classList.add('hidden');
    this.dialog.classList.add('hidden');
    document.body.style.overflow = '';
    this.emit('close');
  }

  /**
   * Handle export action
   */
  async handleExport() {
    if (this.isExporting) return;

    this.isExporting = true;
    this.renderContent();

    try {
      if (this.sessions.length === 1) {
        // Single session export
        await this.exportSingle(this.session);
      } else {
        // Batch export
        await this.exportBatch(this.sessions);
      }

      this.emit('export-complete', { count: this.sessions.length });
      this.close();
    } catch (error) {
      console.error('Export failed:', error);
      this.emit('export-error', { error: error.message });
      this.isExporting = false;
      this.renderContent();
    }
  }

  /**
   * Export single session
   * @param {Session} session
   */
  async exportSingle(session) {
    const html = exportSessionToHtml(session, this.options);
    const filename = generateExportFilename(session);

    // In Electron, use IPC to save file
    if (window.electronAPI?.exportSession) {
      await window.electronAPI.exportSession({ html, filename });
    } else {
      // Browser fallback: download via blob
      this.downloadHtml(html, filename);
    }
  }

  /**
   * Export multiple sessions
   * @param {Session[]} sessions
   */
  async exportBatch(sessions) {
    // In Electron, use IPC for directory selection
    if (window.electronAPI?.exportSessions) {
      const exports = sessions.map((session) => ({
        html: exportSessionToHtml(session, this.options),
        filename: generateExportFilename(session)
      }));
      await window.electronAPI.exportSessions(exports);
    } else {
      // Browser fallback: download each file
      for (const session of sessions) {
        const html = exportSessionToHtml(session, this.options);
        const filename = generateExportFilename(session);
        this.downloadHtml(html, filename);
        // Small delay between downloads
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  /**
   * Download HTML file in browser
   * @param {string} html
   * @param {string} filename
   */
  downloadHtml(html, filename) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Cleanup
   */
  destroy() {
    document.removeEventListener('keydown', this.keydownHandler);
    this.removeAllListeners();
    clearChildren(this.container);
  }
}

export default ExportDialog;
