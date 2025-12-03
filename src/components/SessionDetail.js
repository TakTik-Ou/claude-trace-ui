/**
 * SessionDetail Component
 * Displays full session details with event list, search, and outline navigation
 */

import { h, clearChildren } from '../utils/dom-helpers.js';
import { formatDateTime, formatDuration } from '../utils/date-formatter.js';
import { EventEmitter } from '../lib/EventEmitter.js';
import { VirtualList } from '../lib/VirtualList.js';
import MessageView from './MessageView.js';
import { InSessionSearch, findMatches, highlightMatches } from './InSessionSearch.js';
import { SessionOutline } from './SessionOutline.js';
import { MetadataPanel } from './MetadataPanel.js';

/**
 * @typedef {import('../types/session').Session} Session
 * @typedef {import('../types/session').SessionSummary} SessionSummary
 * @typedef {import('../types/event').Event} Event
 */

const MESSAGE_HEIGHT_ESTIMATE = 150; // Estimated height for virtual list
const MESSAGES_PER_PAGE = 50; // Number of messages to load per page

export class SessionDetail extends EventEmitter {
  /**
   * @param {HTMLElement} container
   * @param {Object} [options]
   * @param {boolean} [options.showOutline=true] - Show session outline sidebar
   * @param {boolean} [options.showMetadata=true] - Show metadata panel
   */
  constructor(container, options = {}) {
    super();
    this.container = container;
    this.options = { showOutline: true, showMetadata: true, ...options };
    /** @type {Session|null} */
    this.session = null;
    /** @type {VirtualList|null} */
    this.virtualList = null;
    /** @type {Map<string, MessageView>} */
    this.messageViews = new Map();
    /** @type {InSessionSearch|null} */
    this.searchComponent = null;
    /** @type {SessionOutline|null} */
    this.outlineComponent = null;
    /** @type {MetadataPanel|null} */
    this.metadataPanel = null;
    /** @type {string} */
    this.currentSearchQuery = '';
    /** @type {number} */
    this.currentPage = 0;
    /** @type {Event[]} */
    this.displayEvents = [];
    /** @type {HTMLElement|null} */
    this.scrollContainer = null;
    /** @type {HTMLElement|null} */
    this.loadMoreBtn = null;
    /** @type {HTMLElement|null} */
    this.messagesWrapper = null;

    this.init();
  }

  init() {
    this.container.className = 'session-detail flex h-full';

    // Main content wrapper
    this.mainWrapper = h('div', { className: 'session-detail-main flex flex-col flex-1 overflow-hidden' });
    this.container.appendChild(this.mainWrapper);

    // Header area
    this.headerEl = h('div', { className: 'session-detail-header p-4 border-b border-gray-700' });
    this.mainWrapper.appendChild(this.headerEl);

    // Search bar container (hidden by default)
    this.searchContainer = h('div', { className: 'search-container' });
    this.mainWrapper.appendChild(this.searchContainer);

    // Messages container
    this.messagesContainer = h('div', {
      className: 'session-messages flex-1 overflow-hidden'
    });
    this.mainWrapper.appendChild(this.messagesContainer);

    // Right sidebar wrapper (outline + metadata)
    this.rightSidebar = h('div', { className: 'right-sidebar w-72 hidden lg:flex flex-col border-l border-gray-700' });
    this.container.appendChild(this.rightSidebar);

    // Outline sidebar (optional)
    if (this.options.showOutline) {
      this.outlineContainer = h('div', { className: 'outline-container flex-1 overflow-hidden' });
      this.rightSidebar.appendChild(this.outlineContainer);
    }

    // Metadata panel (optional)
    if (this.options.showMetadata) {
      this.metadataContainer = h('div', { className: 'metadata-container h-80 border-t border-gray-700' });
      this.rightSidebar.appendChild(this.metadataContainer);
    }

    // Empty state
    this.emptyState = h(
      'div',
      { className: 'empty-state flex items-center justify-center h-full text-gray-500' },
      [h('p', {}, ['Select a session to view details'])]
    );
    this.mainWrapper.appendChild(this.emptyState);

    // Initialize search component
    this.searchComponent = new InSessionSearch(this.searchContainer);
    this.searchComponent.on('search', ({ query }) => this.handleSearch(query));
    this.searchComponent.on('navigate', ({ match }) => this.navigateToMatch(match));
    this.searchComponent.on('clear', () => this.clearSearchHighlights());

    // Initialize outline component
    if (this.options.showOutline && this.outlineContainer) {
      this.outlineComponent = new SessionOutline(this.outlineContainer);
      this.outlineComponent.on('select', (item) => this.scrollToMessage(item.id));
    }

    // Initialize metadata panel
    if (this.options.showMetadata && this.metadataContainer) {
      this.metadataPanel = new MetadataPanel(this.metadataContainer);
    }

    this.showEmpty();
  }

  /**
   * Set session data
   * @param {Session} session
   */
  setSession(session) {
    this.session = session;
    this.renderHeader();
    this.renderMessages();
    this.emptyState.style.display = 'none';
    this.headerEl.style.display = '';
    this.messagesContainer.style.display = '';

    // Update outline with session events
    if (this.outlineComponent && session.events) {
      this.outlineComponent.setEvents(session.events);
    }

    // Update metadata panel with session data
    if (this.metadataPanel) {
      this.metadataPanel.setSession(session);
    }
  }

  /**
   * Show empty state
   */
  showEmpty() {
    this.session = null;
    this.emptyState.style.display = 'flex';
    this.headerEl.style.display = 'none';
    this.messagesContainer.style.display = 'none';
    clearChildren(this.headerEl);
    clearChildren(this.messagesContainer);

    // Clear metadata panel
    if (this.metadataPanel) {
      this.metadataPanel.clear();
    }
  }

  renderHeader() {
    if (!this.session) return;

    clearChildren(this.headerEl);

    const { summary, projectName, createdAt, updatedAt, messageCount, tokenUsage } = this.session;

    // Title
    const titleEl = h('h2', { className: 'text-lg font-semibold text-gray-100 mb-2 truncate' }, [summary || 'Untitled Session']);

    // Project badge
    const projectBadge = h('span', { className: 'inline-block px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded mb-3' }, [projectName]);

    // Stats row
    const statsRow = h('div', { className: 'flex flex-wrap gap-4 text-sm text-gray-400' }, [
      h('span', {}, [`Started: ${formatDateTime(createdAt)}`]),
      h('span', {}, [`Duration: ${formatDuration(updatedAt - createdAt)}`]),
      h('span', {}, [`${messageCount} messages`]),
      tokenUsage ? h('span', {}, [`${Math.round((tokenUsage.input + tokenUsage.output) / 1000)}k tokens`]) : null
    ].filter(Boolean));

    // Back button (for mobile)
    const backBtn = h(
      'button',
      {
        className: 'back-btn md:hidden absolute top-4 left-4 p-2 hover:bg-gray-700 rounded',
        onClick: () => this.emit('back')
      },
      ['← Back']
    );

    // Export button
    const exportBtn = h(
      'button',
      {
        className: 'export-btn absolute top-4 right-4 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded flex items-center gap-1',
        onClick: () => this.emit('export', this.session),
        title: 'Export as HTML'
      },
      ['📤 Export']
    );

    this.headerEl.appendChild(backBtn);
    this.headerEl.appendChild(exportBtn);
    this.headerEl.appendChild(titleEl);
    this.headerEl.appendChild(projectBadge);
    this.headerEl.appendChild(statsRow);
  }

  renderMessages() {
    if (!this.session) return;

    clearChildren(this.messagesContainer);
    this.messageViews.clear();
    this.currentPage = 0;

    const events = this.session.events || [];

    // Filter to only user and assistant events for display
    this.displayEvents = events.filter(
      (e) => e.type === 'user' || e.type === 'assistant'
    );

    if (this.displayEvents.length === 0) {
      const noMessages = h('div', { className: 'p-4 text-gray-500 text-center' }, ['No messages in this session']);
      this.messagesContainer.appendChild(noMessages);
      return;
    }

    // Create scroll container
    this.scrollContainer = h('div', {
      className: 'messages-scroll h-full overflow-y-auto p-4'
    });

    // Messages wrapper for actual content
    this.messagesWrapper = h('div', { className: 'messages-wrapper space-y-2' });
    this.scrollContainer.appendChild(this.messagesWrapper);

    // Show message count info
    const totalCount = this.displayEvents.length;
    if (totalCount > MESSAGES_PER_PAGE) {
      const infoBar = h('div', { className: 'sticky top-0 z-10 bg-gray-800 px-3 py-2 rounded mb-3 flex items-center justify-between text-sm' }, [
        h('span', { className: 'text-gray-400' }, [`${totalCount} messages total`]),
        h('div', { className: 'flex gap-2' }, [
          h('button', {
            className: 'px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded',
            onClick: () => this.jumpToPosition('start')
          }, ['⬆ Top']),
          h('button', {
            className: 'px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded',
            onClick: () => this.jumpToPosition('end')
          }, ['⬇ End'])
        ])
      ]);
      this.scrollContainer.insertBefore(infoBar, this.messagesWrapper);
    }

    // Load first page
    this.loadMoreMessages();

    this.messagesContainer.appendChild(this.scrollContainer);
  }

  /**
   * Load more messages (pagination)
   */
  loadMoreMessages() {
    if (!this.displayEvents || !this.messagesWrapper) return;

    const startIdx = this.currentPage * MESSAGES_PER_PAGE;
    const endIdx = Math.min(startIdx + MESSAGES_PER_PAGE, this.displayEvents.length);
    const pageEvents = this.displayEvents.slice(startIdx, endIdx);

    if (pageEvents.length === 0) return;

    let lastTimeGroup = null;

    for (const event of pageEvents) {
      // Add time group header if needed
      const timeGroup = this.getTimeGroup(event.timestamp);
      if (timeGroup !== lastTimeGroup) {
        const groupHeader = h('div', {
          className: 'time-group-header sticky top-12 z-5 bg-gray-900/95 px-3 py-1.5 text-xs text-gray-500 border-b border-gray-700 -mx-4 mb-2 mt-4 first:mt-0'
        }, [timeGroup]);
        this.messagesWrapper.appendChild(groupHeader);
        lastTimeGroup = timeGroup;
      }

      // Create message view
      const message = this.eventToMessage(event);
      const messageView = new MessageView(message);
      const messageId = event.data?.uuid || String(event.timestamp);
      this.messageViews.set(messageId, messageView);
      this.messagesWrapper.appendChild(messageView.element);
    }

    this.currentPage++;

    // Remove old load more button if exists
    if (this.loadMoreBtn) {
      this.loadMoreBtn.remove();
      this.loadMoreBtn = null;
    }

    // Add load more button if there are more messages
    const remaining = this.displayEvents.length - (this.currentPage * MESSAGES_PER_PAGE);
    if (remaining > 0) {
      this.loadMoreBtn = h('div', { className: 'load-more-container py-4 text-center' }, [
        h('button', {
          className: 'load-more-btn px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm',
          onClick: () => this.loadMoreMessages()
        }, [`Load ${Math.min(remaining, MESSAGES_PER_PAGE)} more (${remaining} remaining)`])
      ]);
      this.messagesWrapper.appendChild(this.loadMoreBtn);
    }
  }

  /**
   * Get time group label for timestamp
   * @param {number} timestamp
   * @returns {string}
   */
  getTimeGroup(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);

    // Format time
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (diffHours < 24 && date.getDate() === now.getDate()) {
      // Today - group by hour
      const hour = date.getHours();
      const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      return `Today ${period} (${timeStr})`;
    } else if (diffHours < 48) {
      return `Yesterday (${timeStr})`;
    } else {
      // Older - show date
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ` (${timeStr})`;
    }
  }

  /**
   * Jump to position in message list
   * @param {'start'|'end'} position
   */
  jumpToPosition(position) {
    if (!this.scrollContainer) return;

    if (position === 'start') {
      this.scrollContainer.scrollTop = 0;
    } else if (position === 'end') {
      // Load all remaining messages first
      while (this.currentPage * MESSAGES_PER_PAGE < this.displayEvents.length) {
        this.loadMoreMessages();
      }
      // Then scroll to bottom
      requestAnimationFrame(() => {
        this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight;
      });
    }
  }

  /**
   * Convert an event to a message format for MessageView
   * @param {Event} event
   * @returns {Object}
   */
  eventToMessage(event) {
    // Claude Code JSONL structure: event.data.message.content
    const message = event.data?.message || {};
    const content = message.content || event.data?.content || '';

    return {
      uuid: event.data?.uuid || String(event.timestamp),
      role: event.type,
      content: content,
      timestamp: event.timestamp,
      toolCalls: event.data?.tool_calls || [],
      usage: event.data?.usage || null
    };
  }

  /**
   * Show loading state
   * @param {boolean} loading
   */
  setLoading(loading) {
    if (loading) {
      clearChildren(this.messagesContainer);
      const loader = h('div', { className: 'flex items-center justify-center h-full' }, [
        h('div', { className: 'animate-pulse text-gray-500' }, ['Loading session...'])
      ]);
      this.messagesContainer.appendChild(loader);
    }
  }

  /**
   * Show error state
   * @param {string} message
   */
  setError(message) {
    clearChildren(this.messagesContainer);
    const errorEl = h('div', { className: 'flex items-center justify-center h-full text-red-400' }, [h('p', {}, [message])]);
    this.messagesContainer.appendChild(errorEl);
  }

  /**
   * Scroll to a specific message (loads more if needed)
   * @param {string} messageId
   */
  scrollToMessage(messageId) {
    // Check if message is already loaded
    let messageView = this.messageViews.get(messageId);

    if (!messageView && this.displayEvents) {
      // Find the message index and load pages until we reach it
      const messageIndex = this.displayEvents.findIndex(
        (e) => (e.data?.uuid || String(e.timestamp)) === messageId
      );

      if (messageIndex >= 0) {
        const targetPage = Math.floor(messageIndex / MESSAGES_PER_PAGE) + 1;
        while (this.currentPage < targetPage) {
          this.loadMoreMessages();
        }
        messageView = this.messageViews.get(messageId);
      }
    }

    if (messageView) {
      messageView.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Handle search query
   * @param {string} query
   */
  handleSearch(query) {
    this.currentSearchQuery = query;
    this.clearSearchHighlights();

    if (!query || !this.session) {
      this.searchComponent?.setMatches([]);
      return;
    }

    // Collect all matches across messages
    const allMatches = [];
    const events = this.session.events || [];
    const displayEvents = events.filter(
      (e) => e.type === 'user' || e.type === 'assistant'
    );

    for (const event of displayEvents) {
      const messageId = event.data?.uuid || String(event.timestamp);
      // Claude Code JSONL structure: event.data.message.content
      const message = event.data?.message || {};
      const content = message.content || event.data?.content || '';
      // Convert content to searchable text
      const textContent = this.extractTextContent(content);
      const matches = findMatches(textContent, query, messageId);
      allMatches.push(...matches);
    }

    // Update search component with matches
    this.searchComponent?.setMatches(allMatches);

    // Highlight all matches in visible messages
    if (allMatches.length > 0) {
      this.highlightAllMatches(query);
    }
  }

  /**
   * Highlight all search matches in messages
   * @param {string} query
   */
  highlightAllMatches(query) {
    if (!query) return;

    this.messageViews.forEach((messageView) => {
      const contentEl = messageView.element.querySelector('.message-content');
      if (contentEl) {
        const originalText = contentEl.textContent || '';
        const highlighted = highlightMatches(originalText, query);
        // Store original for later restoration
        if (!contentEl.dataset.originalHtml) {
          contentEl.dataset.originalHtml = contentEl.innerHTML;
        }
        contentEl.innerHTML = highlighted;
      }
    });
  }

  /**
   * Navigate to a specific search match
   * @param {{ messageId: string, index: number }} match
   */
  navigateToMatch(match) {
    if (!match) return;

    // Scroll to the message containing the match
    this.scrollToMessage(match.messageId);

    // Highlight the current match differently
    const messageView = this.messageViews.get(match.messageId);
    if (messageView) {
      const highlights = messageView.element.querySelectorAll('.search-highlight');
      highlights.forEach((el, i) => {
        el.classList.remove('current-match');
        if (i === match.index) {
          el.classList.add('current-match');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  /**
   * Extract plain text from content (handles string or content blocks array)
   * @param {string|Array} content
   * @returns {string}
   */
  extractTextContent(content) {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .filter((block) => block.type === 'text')
        .map((block) => block.text || '')
        .join('\n');
    }
    return '';
  }

  /**
   * Clear all search highlights
   */
  clearSearchHighlights() {
    this.currentSearchQuery = '';
    this.messageViews.forEach((messageView) => {
      const contentEl = messageView.element.querySelector('.message-content');
      if (contentEl && contentEl.dataset.originalHtml) {
        contentEl.innerHTML = contentEl.dataset.originalHtml;
        delete contentEl.dataset.originalHtml;
      }
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    this.virtualList?.destroy();
    this.searchComponent?.destroy();
    this.outlineComponent?.destroy();
    this.metadataPanel?.destroy();
    this.messageViews.forEach((view) => view.destroy?.());
    this.messageViews.clear();
    this.removeAllListeners();
    clearChildren(this.container);
  }
}

export default SessionDetail;
