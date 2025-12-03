/**
 * FilterPanel Component
 * Filter sessions by project, date range, and sort options
 */

import { h, clearChildren } from '../utils/dom-helpers.js';
import { EventEmitter } from '../lib/EventEmitter.js';

/**
 * @typedef {Object} FilterState
 * @property {string|null} projectName - Selected project filter
 * @property {number|null} dateFrom - Start date timestamp
 * @property {number|null} dateTo - End date timestamp
 * @property {string} sortBy - Sort field
 * @property {'asc'|'desc'} sortOrder - Sort direction
 */

export class FilterPanel extends EventEmitter {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super();
    this.container = container;
    /** @type {string[]} */
    this.projects = [];
    /** @type {FilterState} */
    this.filters = {
      projectName: null,
      dateFrom: null,
      dateTo: null,
      sortBy: 'date',
      sortOrder: 'desc'
    };
    /** @type {boolean} */
    this.isExpanded = false;

    this.init();
  }

  init() {
    this.container.className = 'filter-panel';
    this.render();
  }

  render() {
    clearChildren(this.container);

    // Filter toggle button
    const toggleBtn = h(
      'button',
      {
        className: 'filter-toggle flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded',
        onClick: () => this.toggleExpanded()
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
              d: 'M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z',
              clipRule: 'evenodd'
            })
          ]
        ),
        'Filters',
        this.hasActiveFilters() ? h('span', { className: 'filter-badge w-2 h-2 bg-blue-500 rounded-full' }) : null
      ].filter(Boolean)
    );

    // Filter content (expandable)
    this.filterContent = h('div', {
      className: `filter-content ${this.isExpanded ? '' : 'hidden'} mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700`
    });

    if (this.isExpanded) {
      this.renderFilterContent();
    }

    this.container.appendChild(toggleBtn);
    this.container.appendChild(this.filterContent);
  }

  /**
   * Render filter content
   */
  renderFilterContent() {
    clearChildren(this.filterContent);

    // Project filter
    const projectSection = this.createProjectFilter();
    this.filterContent.appendChild(projectSection);

    // Date range filter
    const dateSection = this.createDateFilter();
    this.filterContent.appendChild(dateSection);

    // Sort options
    const sortSection = this.createSortOptions();
    this.filterContent.appendChild(sortSection);

    // Clear filters button
    if (this.hasActiveFilters()) {
      const clearBtn = h(
        'button',
        {
          className: 'clear-filters-btn w-full mt-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 rounded border border-gray-600',
          onClick: () => this.clearFilters()
        },
        ['Clear All Filters']
      );
      this.filterContent.appendChild(clearBtn);
    }
  }

  /**
   * Create project filter dropdown
   * @returns {HTMLElement}
   */
  createProjectFilter() {
    const section = h('div', { className: 'filter-section mb-3' });

    const label = h('label', { className: 'block text-xs text-gray-400 mb-1' }, ['Project']);

    this.projectSelect = h(
      'select',
      {
        className: 'filter-select w-full px-2 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-blue-500',
        onChange: (e) => this.setFilter('projectName', e.target.value || null)
      },
      [h('option', { value: '' }, ['All Projects']), ...this.projects.map((project) => h('option', { value: project, selected: this.filters.projectName === project }, [project]))]
    );

    section.appendChild(label);
    section.appendChild(this.projectSelect);

    return section;
  }

  /**
   * Create date range filter
   * @returns {HTMLElement}
   */
  createDateFilter() {
    const section = h('div', { className: 'filter-section mb-3' });

    const label = h('label', { className: 'block text-xs text-gray-400 mb-1' }, ['Date Range']);

    const dateRow = h('div', { className: 'flex gap-2' });

    // From date
    this.dateFromInput = h('input', {
      type: 'date',
      className: 'date-input flex-1 px-2 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-blue-500',
      value: this.filters.dateFrom ? this.timestampToDateString(this.filters.dateFrom) : '',
      onChange: (e) => this.setFilter('dateFrom', e.target.value ? this.dateStringToTimestamp(e.target.value) : null)
    });

    const separator = h('span', { className: 'text-gray-500 self-center' }, ['to']);

    // To date
    this.dateToInput = h('input', {
      type: 'date',
      className: 'date-input flex-1 px-2 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-blue-500',
      value: this.filters.dateTo ? this.timestampToDateString(this.filters.dateTo) : '',
      onChange: (e) => this.setFilter('dateTo', e.target.value ? this.dateStringToTimestamp(e.target.value, true) : null)
    });

    dateRow.appendChild(this.dateFromInput);
    dateRow.appendChild(separator);
    dateRow.appendChild(this.dateToInput);

    section.appendChild(label);
    section.appendChild(dateRow);

    return section;
  }

  /**
   * Create sort options
   * @returns {HTMLElement}
   */
  createSortOptions() {
    const section = h('div', { className: 'filter-section' });

    const label = h('label', { className: 'block text-xs text-gray-400 mb-1' }, ['Sort By']);

    const sortRow = h('div', { className: 'flex gap-2' });

    // Sort field
    this.sortBySelect = h(
      'select',
      {
        className: 'sort-select flex-1 px-2 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-blue-500',
        onChange: (e) => this.setFilter('sortBy', e.target.value)
      },
      [
        h('option', { value: 'date', selected: this.filters.sortBy === 'date' }, ['Date']),
        h('option', { value: 'project', selected: this.filters.sortBy === 'project' }, ['Project']),
        h('option', { value: 'duration', selected: this.filters.sortBy === 'duration' }, ['Duration']),
        h('option', { value: 'tokens', selected: this.filters.sortBy === 'tokens' }, ['Tokens'])
      ]
    );

    // Sort order toggle
    this.sortOrderBtn = h(
      'button',
      {
        className: 'sort-order-btn px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-gray-200 hover:bg-gray-700',
        onClick: () => this.toggleSortOrder(),
        title: this.filters.sortOrder === 'desc' ? 'Descending' : 'Ascending'
      },
      [this.filters.sortOrder === 'desc' ? '↓' : '↑']
    );

    sortRow.appendChild(this.sortBySelect);
    sortRow.appendChild(this.sortOrderBtn);

    section.appendChild(label);
    section.appendChild(sortRow);

    return section;
  }

  /**
   * Set available projects
   * @param {string[]} projects
   */
  setProjects(projects) {
    this.projects = [...new Set(projects)].sort();
    if (this.isExpanded) {
      this.renderFilterContent();
    }
  }

  /**
   * Set a filter value
   * @param {keyof FilterState} key
   * @param {any} value
   */
  setFilter(key, value) {
    this.filters[key] = value;
    this.emitChange();

    // Re-render to update clear button visibility
    if (this.isExpanded) {
      this.renderFilterContent();
    }
    this.render(); // Update toggle badge
  }

  /**
   * Toggle sort order
   */
  toggleSortOrder() {
    this.filters.sortOrder = this.filters.sortOrder === 'desc' ? 'asc' : 'desc';
    this.emitChange();

    if (this.sortOrderBtn) {
      this.sortOrderBtn.textContent = this.filters.sortOrder === 'desc' ? '↓' : '↑';
      this.sortOrderBtn.title = this.filters.sortOrder === 'desc' ? 'Descending' : 'Ascending';
    }
  }

  /**
   * Toggle expanded state
   */
  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    this.render();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filters = {
      projectName: null,
      dateFrom: null,
      dateTo: null,
      sortBy: 'date',
      sortOrder: 'desc'
    };
    this.emitChange();
    this.render();
  }

  /**
   * Check if any filters are active
   * @returns {boolean}
   */
  hasActiveFilters() {
    return this.filters.projectName !== null || this.filters.dateFrom !== null || this.filters.dateTo !== null;
  }

  /**
   * Emit filter change event
   */
  emitChange() {
    this.emit('change', { ...this.filters });
  }

  /**
   * Get current filters
   * @returns {FilterState}
   */
  getFilters() {
    return { ...this.filters };
  }

  /**
   * Convert timestamp to date string (YYYY-MM-DD)
   * @param {number} timestamp
   * @returns {string}
   */
  timestampToDateString(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  }

  /**
   * Convert date string to timestamp
   * @param {string} dateString
   * @param {boolean} [endOfDay=false]
   * @returns {number}
   */
  dateStringToTimestamp(dateString, endOfDay = false) {
    const date = new Date(dateString);
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    }
    return date.getTime();
  }

  /**
   * Cleanup
   */
  destroy() {
    this.removeAllListeners();
    clearChildren(this.container);
  }
}

export default FilterPanel;
