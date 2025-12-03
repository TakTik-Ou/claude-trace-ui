/**
 * FilterBar Component
 * Project filter dropdown and date range picker
 */

import { h, clearChildren } from '../utils/dom-helpers.js';
import { EventEmitter } from '../lib/EventEmitter.js';

/**
 * @typedef {Object} FilterState
 * @property {string|null} project - Selected project path
 * @property {number|null} dateFrom - Start date timestamp
 * @property {number|null} dateTo - End date timestamp
 */

export class FilterBar extends EventEmitter {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super();
    this.container = container;
    /** @type {string[]} */
    this.projects = [];
    /** @type {FilterState} */
    this.state = {
      project: null,
      dateFrom: null,
      dateTo: null
    };

    this.init();
  }

  init() {
    this.container.className = 'filter-bar flex flex-wrap items-center gap-3 p-3 bg-gray-900 border-b border-gray-700';

    this.render();
  }

  render() {
    clearChildren(this.container);

    // Project filter dropdown
    this.projectSelect = h(
      'select',
      {
        className: 'project-select px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500',
        onChange: (e) => this.setProject(e.target.value || null)
      },
      [h('option', { value: '' }, ['All Projects'])]
    );

    // Date range - From
    const dateFromLabel = h('label', { className: 'text-xs text-gray-500' }, ['From:']);
    this.dateFromInput = h('input', {
      type: 'date',
      className: 'date-input px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm',
      onChange: (e) => this.setDateFrom(e.target.value)
    });

    // Date range - To
    const dateToLabel = h('label', { className: 'text-xs text-gray-500' }, ['To:']);
    this.dateToInput = h('input', {
      type: 'date',
      className: 'date-input px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm',
      onChange: (e) => this.setDateTo(e.target.value)
    });

    // Quick date presets
    const presets = h('div', { className: 'flex gap-1' }, [
      this.createPresetButton('Today', () => this.setPreset('today')),
      this.createPresetButton('Week', () => this.setPreset('week')),
      this.createPresetButton('Month', () => this.setPreset('month')),
      this.createPresetButton('All', () => this.setPreset('all'))
    ]);

    // Clear filters button
    const clearBtn = h(
      'button',
      {
        className: 'clear-btn px-2 py-1 text-xs text-gray-400 hover:text-gray-200',
        onClick: () => this.clearFilters()
      },
      ['Clear']
    );

    // Session count
    this.countEl = h('span', { className: 'session-count text-xs text-gray-500 ml-auto' }, ['']);

    // Assemble
    this.container.appendChild(this.projectSelect);
    this.container.appendChild(dateFromLabel);
    this.container.appendChild(this.dateFromInput);
    this.container.appendChild(dateToLabel);
    this.container.appendChild(this.dateToInput);
    this.container.appendChild(presets);
    this.container.appendChild(clearBtn);
    this.container.appendChild(this.countEl);
  }

  /**
   * Create preset button
   * @param {string} label
   * @param {() => void} onClick
   * @returns {HTMLElement}
   */
  createPresetButton(label, onClick) {
    return h(
      'button',
      {
        className: 'preset-btn px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded',
        onClick
      },
      [label]
    );
  }

  /**
   * Set available projects
   * @param {string[]} projects
   */
  setProjects(projects) {
    this.projects = projects;

    // Update project dropdown
    clearChildren(this.projectSelect);
    this.projectSelect.appendChild(h('option', { value: '' }, ['All Projects']));

    for (const project of projects) {
      const name = project.split('/').pop() || project;
      this.projectSelect.appendChild(h('option', { value: project }, [name]));
    }
  }

  /**
   * Set project filter
   * @param {string|null} project
   */
  setProject(project) {
    this.state.project = project;
    this.emitChange();
  }

  /**
   * Set date from filter
   * @param {string} dateStr
   */
  setDateFrom(dateStr) {
    this.state.dateFrom = dateStr ? new Date(dateStr).getTime() : null;
    this.emitChange();
  }

  /**
   * Set date to filter
   * @param {string} dateStr
   */
  setDateTo(dateStr) {
    if (dateStr) {
      // Set to end of day
      const date = new Date(dateStr);
      date.setHours(23, 59, 59, 999);
      this.state.dateTo = date.getTime();
    } else {
      this.state.dateTo = null;
    }
    this.emitChange();
  }

  /**
   * Set date preset
   * @param {'today'|'week'|'month'|'all'} preset
   */
  setPreset(preset) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'today':
        this.state.dateFrom = today.getTime();
        this.state.dateTo = null;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        this.state.dateFrom = weekAgo.getTime();
        this.state.dateTo = null;
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        this.state.dateFrom = monthAgo.getTime();
        this.state.dateTo = null;
        break;
      case 'all':
        this.state.dateFrom = null;
        this.state.dateTo = null;
        break;
    }

    // Update inputs
    this.dateFromInput.value = this.state.dateFrom ? this.formatDateInput(this.state.dateFrom) : '';
    this.dateToInput.value = this.state.dateTo ? this.formatDateInput(this.state.dateTo) : '';

    this.emitChange();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.state = { project: null, dateFrom: null, dateTo: null };
    this.projectSelect.value = '';
    this.dateFromInput.value = '';
    this.dateToInput.value = '';
    this.emitChange();
  }

  /**
   * Format timestamp for date input
   * @param {number} timestamp
   * @returns {string}
   */
  formatDateInput(timestamp) {
    const d = new Date(timestamp);
    return d.toISOString().split('T')[0];
  }

  /**
   * Update session count display
   * @param {number} filtered
   * @param {number} total
   */
  setCount(filtered, total) {
    this.countEl.textContent = filtered === total ? `${total} sessions` : `${filtered} of ${total} sessions`;
  }

  /**
   * Emit filter change
   */
  emitChange() {
    this.emit('change', { ...this.state });
  }

  /**
   * Get current filter state
   * @returns {FilterState}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.removeAllListeners();
    clearChildren(this.container);
  }
}

export default FilterBar;
