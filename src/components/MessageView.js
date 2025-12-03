/**
 * MessageView Component
 * Renders a single message (user or assistant)
 */

import { h } from '../utils/dom-helpers.js';
import { formatTime } from '../utils/date-formatter.js';
import { renderMarkdown } from '../services/markdown-renderer.js';
import ToolCallView from './ToolCallView.js';

/**
 * @typedef {import('../types/event').Message} Message
 * @typedef {import('../types/event').ToolCall} ToolCall
 */

export class MessageView {
  /**
   * @param {Message} message
   */
  constructor(message) {
    this.message = message;
    /** @type {ToolCallView[]} */
    this.toolCallViews = [];
    this.element = this.render();
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const { role, content, timestamp, toolCalls } = this.message;

    const isUser = role === 'user';
    const isAssistant = role === 'assistant';

    // Container classes based on role
    const containerClasses = [
      'message',
      'rounded-lg',
      'p-4',
      isUser ? 'message-user bg-blue-900/30 border border-blue-800' : '',
      isAssistant ? 'message-assistant bg-gray-800 border border-gray-700' : ''
    ]
      .filter(Boolean)
      .join(' ');

    // Get token usage from message data (assistant messages only)
    const usage = this.message.usage || null;
    const tokenCount = usage ? (usage.input || 0) + (usage.output || 0) : 0;

    // Role indicator with optional token count
    const roleLabel = h('div', { className: 'flex items-center gap-2 mb-2' }, [
      h('span', { className: `text-xs font-medium ${isUser ? 'text-blue-400' : 'text-green-400'}` }, [isUser ? 'User' : 'Assistant']),
      timestamp ? h('span', { className: 'text-xs text-gray-500' }, [formatTime(timestamp)]) : null,
      tokenCount > 0 ? h('span', { className: 'text-xs text-gray-600', title: `Input: ${usage.input || 0}, Output: ${usage.output || 0}` }, [`${Math.round(tokenCount / 1000)}k tokens`]) : null
    ].filter(Boolean));

    // Content area
    const contentEl = h('div', { className: 'message-content prose prose-invert prose-sm max-w-none' });

    // Render content based on type
    if (typeof content === 'string') {
      contentEl.innerHTML = renderMarkdown(content);
    } else if (Array.isArray(content)) {
      // Handle content blocks (text, tool_use, etc.)
      for (const block of content) {
        if (block.type === 'text') {
          const textEl = h('div', { className: 'mb-2' });
          textEl.innerHTML = renderMarkdown(block.text);
          contentEl.appendChild(textEl);
        } else if (block.type === 'tool_use') {
          const toolView = new ToolCallView({
            id: block.id,
            name: block.name,
            input: block.input
          });
          this.toolCallViews.push(toolView);
          contentEl.appendChild(toolView.element);
        } else if (block.type === 'tool_result') {
          const resultEl = this.renderToolResult(block);
          contentEl.appendChild(resultEl);
        }
      }
    }

    // Tool calls (if separate from content)
    if (toolCalls && toolCalls.length > 0) {
      const toolsContainer = h('div', { className: 'mt-3 space-y-2' });
      for (const toolCall of toolCalls) {
        const toolView = new ToolCallView(toolCall);
        this.toolCallViews.push(toolView);
        toolsContainer.appendChild(toolView.element);
      }
      contentEl.appendChild(toolsContainer);
    }

    // Assemble message
    const messageEl = h('div', { className: containerClasses, dataMessageId: this.message.uuid }, [roleLabel, contentEl]);

    return messageEl;
  }

  /**
   * Render tool result block
   * @param {Object} block
   * @returns {HTMLElement}
   */
  renderToolResult(block) {
    const isError = block.is_error;
    const content = typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2);

    return h('div', { className: `tool-result mt-2 p-2 rounded text-sm ${isError ? 'bg-red-900/30 border border-red-800' : 'bg-gray-900 border border-gray-700'}` }, [
      h('div', { className: 'flex items-center gap-2 mb-1' }, [
        h('span', { className: `text-xs ${isError ? 'text-red-400' : 'text-gray-400'}` }, [isError ? '✗ Error' : '✓ Result']),
        block.tool_use_id ? h('span', { className: 'text-xs text-gray-500' }, [`ID: ${block.tool_use_id.slice(0, 8)}...`]) : null
      ].filter(Boolean)),
      h('pre', { className: 'text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap' }, [content.slice(0, 1000) + (content.length > 1000 ? '...' : '')])
    ]);
  }

  /**
   * Update message (for streaming)
   * @param {Message} message
   */
  update(message) {
    this.message = message;
    const newElement = this.render();
    this.element.replaceWith(newElement);
    this.element = newElement;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.toolCallViews.forEach((view) => view.destroy?.());
    this.toolCallViews = [];
  }
}

export default MessageView;
