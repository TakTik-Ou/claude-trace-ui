/**
 * DOM Helpers - Secure DOM manipulation utilities
 * IMPORTANT: Never use innerHTML with untrusted data
 */

/**
 * Create an element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} [attrs] - Attributes to set
 * @param {(Node|string)[]} [children] - Child nodes or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  // Set attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('data')) {
      // data-* attributes - convert dataFooBar to fooBar for dataset API
      const dataKey = key.replace(/^data/, '');
      // Convert first char to lowercase (dataSessionId -> sessionId)
      const camelKey = dataKey.charAt(0).toLowerCase() + dataKey.slice(1);
      element.dataset[camelKey] = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      // Event listeners
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (value !== undefined && value !== null && value !== false) {
      element.setAttribute(key, String(value));
    }
  }

  // Add children
  for (const child of children) {
    if (typeof child === 'string') {
      // Text content - safe, auto-escapes
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

/**
 * Shorthand for createElement
 * @type {typeof createElement}
 */
export const h = createElement;

/**
 * Create a text node (safe)
 * @param {string} text
 * @returns {Text}
 */
export function text(text) {
  return document.createTextNode(text);
}

/**
 * Clear all children from an element
 * @param {HTMLElement} element
 */
export function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Replace all children of an element
 * @param {HTMLElement} element
 * @param {Node[]} children
 */
export function setChildren(element, children) {
  clearChildren(element);
  for (const child of children) {
    element.appendChild(child);
  }
}

/**
 * Add a class to an element if condition is true
 * @param {HTMLElement} element
 * @param {string} className
 * @param {boolean} condition
 */
export function toggleClass(element, className, condition) {
  if (condition) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

/**
 * Query selector with type assertion
 * @template {HTMLElement} T
 * @param {string} selector
 * @param {ParentNode} [parent]
 * @returns {T | null}
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query selector all
 * @param {string} selector
 * @param {ParentNode} [parent]
 * @returns {HTMLElement[]}
 */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Add event listener with cleanup
 * @param {EventTarget} target
 * @param {string} event
 * @param {EventListener} handler
 * @param {AddEventListenerOptions} [options]
 * @returns {() => void} Cleanup function
 */
export function on(target, event, handler, options) {
  target.addEventListener(event, handler, options);
  return () => target.removeEventListener(event, handler, options);
}

/**
 * Add multiple event listeners
 * @param {EventTarget} target
 * @param {Record<string, EventListener>} events
 * @returns {() => void} Cleanup function
 */
export function onMany(target, events) {
  const cleanups = Object.entries(events).map(([event, handler]) =>
    on(target, event, handler)
  );
  return () => cleanups.forEach((cleanup) => cleanup());
}

/**
 * Wait for next animation frame
 * @returns {Promise<number>}
 */
export function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * Wait for element to be added to DOM
 * @param {string} selector
 * @param {number} [timeout=5000]
 * @returns {Promise<HTMLElement>}
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Escape HTML special characters
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Check if element is visible in viewport
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view smoothly
 * @param {HTMLElement} element
 * @param {ScrollIntoViewOptions} [options]
 */
export function scrollIntoView(element, options = { behavior: 'smooth', block: 'nearest' }) {
  element.scrollIntoView(options);
}

export const domHelpers = {
  createElement,
  h,
  text,
  clearChildren,
  setChildren,
  toggleClass,
  $,
  $$,
  on,
  onMany,
  nextFrame,
  waitForElement,
  escapeHtml,
  isInViewport,
  scrollIntoView
};

export default domHelpers;
