/**
 * VirtualList - Efficient virtual scrolling for large lists
 * Only renders visible items to maintain performance with 1000+ items
 *
 * Based on Intersection Observer API for efficiency
 */

/**
 * @typedef {Object} VirtualListOptions
 * @property {number} itemHeight - Fixed height per item in pixels
 * @property {number} [overscan=5] - Number of extra items to render above/below visible area
 * @property {(item: unknown, index: number) => HTMLElement} renderItem - Function to render an item
 */

export class VirtualList {
  /** @type {HTMLElement} */
  #container;

  /** @type {HTMLElement} */
  #content;

  /** @type {number} */
  #itemHeight;

  /** @type {number} */
  #overscan;

  /** @type {(item: unknown, index: number) => HTMLElement} */
  #renderItem;

  /** @type {unknown[]} */
  #items = [];

  /** @type {Map<number, HTMLElement>} */
  #renderedItems = new Map();

  /** @type {number} */
  #startIndex = 0;

  /** @type {number} */
  #endIndex = 0;

  /** @type {(() => void) | null} */
  #scrollHandler = null;

  /**
   * Create a virtual list
   * @param {HTMLElement} container - Scroll container element
   * @param {VirtualListOptions} options
   */
  constructor(container, options) {
    this.#container = container;
    this.#itemHeight = options.itemHeight;
    this.#overscan = options.overscan ?? 5;
    this.#renderItem = options.renderItem;

    this.#setup();
  }

  /**
   * Set up the virtual list structure
   */
  #setup() {
    // Create content wrapper for positioning
    this.#content = document.createElement('div');
    this.#content.className = 'virtual-list-content';
    this.#content.style.cssText = 'position: relative; width: 100%;';

    // Add required styles without overwriting existing ones
    this.#container.style.overflowY = 'auto';
    this.#container.style.position = 'relative';
    this.#container.appendChild(this.#content);

    // Attach scroll handler with throttling
    let ticking = false;
    this.#scrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.#updateVisibleItems();
          ticking = false;
        });
        ticking = true;
      }
    };

    this.#container.addEventListener('scroll', this.#scrollHandler, { passive: true });
  }

  /**
   * Set the items to display
   * @param {unknown[]} items - Array of items
   */
  setItems(items) {
    this.#items = items;
    this.#content.style.height = `${items.length * this.#itemHeight}px`;
    this.#renderedItems.clear();
    this.#content.innerHTML = '';
    this.#updateVisibleItems();
  }

  /**
   * Get the current items
   * @returns {unknown[]}
   */
  getItems() {
    return this.#items;
  }

  /**
   * Update which items are visible and render them
   */
  #updateVisibleItems() {
    const scrollTop = this.#container.scrollTop;
    const containerHeight = this.#container.clientHeight;

    // Calculate visible range
    const newStartIndex = Math.max(0, Math.floor(scrollTop / this.#itemHeight) - this.#overscan);
    const visibleCount = Math.ceil(containerHeight / this.#itemHeight);
    const newEndIndex = Math.min(
      this.#items.length,
      newStartIndex + visibleCount + this.#overscan * 2
    );

    // Only update if range changed
    if (newStartIndex === this.#startIndex && newEndIndex === this.#endIndex) {
      return;
    }

    this.#startIndex = newStartIndex;
    this.#endIndex = newEndIndex;

    // Remove items outside the new range
    for (const [index, element] of this.#renderedItems) {
      if (index < newStartIndex || index >= newEndIndex) {
        element.remove();
        this.#renderedItems.delete(index);
      }
    }

    // Add new items in the range
    for (let i = newStartIndex; i < newEndIndex; i++) {
      if (!this.#renderedItems.has(i) && i < this.#items.length) {
        const element = this.#renderItem(this.#items[i], i);
        element.style.cssText = `
          position: absolute;
          top: ${i * this.#itemHeight}px;
          left: 0;
          right: 0;
          height: ${this.#itemHeight}px;
        `;
        this.#content.appendChild(element);
        this.#renderedItems.set(i, element);
      }
    }
  }

  /**
   * Scroll to a specific item
   * @param {number} index - Item index to scroll to
   * @param {'start' | 'center' | 'end'} [align='start'] - Alignment
   */
  scrollToIndex(index, align = 'start') {
    const containerHeight = this.#container.clientHeight;
    let scrollTop = index * this.#itemHeight;

    if (align === 'center') {
      scrollTop -= (containerHeight - this.#itemHeight) / 2;
    } else if (align === 'end') {
      scrollTop -= containerHeight - this.#itemHeight;
    }

    this.#container.scrollTop = Math.max(0, scrollTop);
  }

  /**
   * Get the currently visible item indices
   * @returns {{ start: number, end: number }}
   */
  getVisibleRange() {
    return {
      start: this.#startIndex,
      end: this.#endIndex
    };
  }

  /**
   * Force a re-render of visible items
   */
  refresh() {
    this.#renderedItems.forEach((element) => element.remove());
    this.#renderedItems.clear();
    this.#updateVisibleItems();
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    if (this.#scrollHandler) {
      this.#container.removeEventListener('scroll', this.#scrollHandler);
      this.#scrollHandler = null;
    }
    this.#renderedItems.clear();
    this.#content.remove();
  }
}

export default VirtualList;
