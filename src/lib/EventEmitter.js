/**
 * EventEmitter - Lightweight pub/sub implementation
 * Used for state management and component communication
 *
 * @template {Record<string, unknown[]>} EventMap
 */

/**
 * @typedef {Object} EventEmitterOptions
 * @property {number} [maxListeners=10] - Maximum listeners per event
 */

export class EventEmitter {
  /** @type {Map<string, Set<Function>>} */
  #listeners = new Map();

  /** @type {number} */
  #maxListeners;

  /**
   * Create a new EventEmitter
   * @param {EventEmitterOptions} [options]
   */
  constructor(options = {}) {
    this.#maxListeners = options.maxListeners ?? 10;
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {() => void} Cleanup function
   */
  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }

    const listeners = this.#listeners.get(event);

    if (listeners.size >= this.#maxListeners) {
      console.warn(
        `EventEmitter: Max listeners (${this.#maxListeners}) exceeded for event "${event}"`
      );
    }

    listeners.add(callback);

    // Return cleanup function
    return () => this.off(event, callback);
  }

  /**
   * Add a one-time event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {() => void} Cleanup function
   */
  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback.apply(this, args);
    };
    return this.on(event, wrapper);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler to remove
   */
  off(event, callback) {
    const listeners = this.#listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.#listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...unknown} args - Arguments to pass to handlers
   */
  emit(event, ...args) {
    const listeners = this.#listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback.apply(this, args);
        } catch (error) {
          console.error(`EventEmitter: Error in handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event, or all events
   * @param {string} [event] - Event name (omit to clear all)
   */
  removeAllListeners(event) {
    if (event) {
      this.#listeners.delete(event);
    } else {
      this.#listeners.clear();
    }
  }

  /**
   * Get the count of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Listener count
   */
  listenerCount(event) {
    return this.#listeners.get(event)?.size ?? 0;
  }

  /**
   * Get all event names with listeners
   * @returns {string[]} Event names
   */
  eventNames() {
    return Array.from(this.#listeners.keys());
  }
}

export default EventEmitter;
