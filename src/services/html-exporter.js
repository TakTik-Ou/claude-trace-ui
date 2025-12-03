/**
 * HTML Exporter Service
 * Generates standalone HTML files from session data
 */

import { formatDateTime, formatDuration } from '../utils/date-formatter.js';
import { renderMarkdown } from './markdown-renderer.js';

/**
 * @typedef {import('../types/session').Session} Session
 * @typedef {import('../types/event').Event} Event
 */

/**
 * @typedef {Object} ExportOptions
 * @property {boolean} [includeToolOutputs=true] - Include tool call outputs
 * @property {boolean} [includeSyntaxHighlighting=true] - Enable syntax highlighting
 * @property {boolean} [includeMetadata=true] - Include session metadata
 * @property {string} [theme='dark'] - Color theme: 'dark' or 'light'
 */

/**
 * Export a session to standalone HTML
 * @param {Session} session - Session to export
 * @param {ExportOptions} [options] - Export options
 * @returns {string} Complete HTML document
 */
export function exportSessionToHtml(session, options = {}) {
  const opts = {
    includeToolOutputs: true,
    includeSyntaxHighlighting: true,
    includeMetadata: true,
    theme: 'dark',
    ...options
  };

  const styles = generateStyles(opts);
  const content = generateContent(session, opts);
  const metadata = opts.includeMetadata ? generateMetadata(session) : '';

  return `<!DOCTYPE html>
<html lang="en" class="${opts.theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(session.summary || 'Untitled Session')} - Claude Trace Export</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>${escapeHtml(session.summary || 'Untitled Session')}</h1>
      <div class="project-badge">${escapeHtml(session.projectName || 'Unknown Project')}</div>
      ${metadata}
    </header>
    <main class="messages">
      ${content}
    </main>
    <footer class="footer">
      <p>Exported from Claude Trace UI on ${formatDateTime(Date.now())}</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Generate CSS styles for export
 * @param {ExportOptions} opts
 * @returns {string}
 */
function generateStyles(opts) {
  const isDark = opts.theme === 'dark';

  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      background: ${isDark ? '#1a1a2e' : '#f5f5f5'};
      color: ${isDark ? '#e0e0e0' : '#333'};
      padding: 2rem;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid ${isDark ? '#333' : '#ddd'};
    }

    .header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: ${isDark ? '#fff' : '#111'};
    }

    .project-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: ${isDark ? '#1e3a5f' : '#e3f2fd'};
      color: ${isDark ? '#64b5f6' : '#1565c0'};
      border-radius: 4px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.875rem;
      color: ${isDark ? '#999' : '#666'};
    }

    .messages {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message {
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid ${isDark ? '#333' : '#ddd'};
    }

    .message--user {
      background: ${isDark ? '#1e3a5f' : '#e3f2fd'};
      border-color: ${isDark ? '#2d4a6f' : '#bbdefb'};
    }

    .message--assistant {
      background: ${isDark ? '#2d3a2d' : '#f1f8e9'};
      border-color: ${isDark ? '#3d4a3d' : '#c5e1a5'};
    }

    .message--tool {
      background: ${isDark ? '#3a3a2d' : '#fff8e1'};
      border-color: ${isDark ? '#4a4a3d' : '#ffecb3'};
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .message-role {
      text-transform: capitalize;
    }

    .message-time {
      color: ${isDark ? '#888' : '#999'};
      font-weight: normal;
    }

    .message-content {
      font-size: 0.9375rem;
    }

    .message-content p {
      margin-bottom: 0.75rem;
    }

    .message-content p:last-child {
      margin-bottom: 0;
    }

    .tool-call {
      margin-top: 1rem;
      padding: 0.75rem;
      background: ${isDark ? '#252525' : '#fafafa'};
      border-radius: 6px;
      border: 1px solid ${isDark ? '#444' : '#e0e0e0'};
    }

    .tool-call-header {
      font-weight: 500;
      font-size: 0.875rem;
      color: ${isDark ? '#ffc107' : '#f57c00'};
      margin-bottom: 0.5rem;
    }

    .tool-call-input,
    .tool-call-output {
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-size: 0.8125rem;
      overflow-x: auto;
    }

    pre {
      background: ${isDark ? '#1a1a1a' : '#f5f5f5'};
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin: 0.5rem 0;
    }

    code {
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-size: 0.875em;
      background: ${isDark ? '#333' : '#e8e8e8'};
      padding: 0.125rem 0.25rem;
      border-radius: 3px;
    }

    pre code {
      background: transparent;
      padding: 0;
    }

    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid ${isDark ? '#333' : '#ddd'};
      text-align: center;
      font-size: 0.75rem;
      color: ${isDark ? '#666' : '#999'};
    }

    @media print {
      body { background: white; color: black; padding: 0; }
      .message { break-inside: avoid; }
    }
  `;
}

/**
 * Generate session metadata HTML
 * @param {Session} session
 * @returns {string}
 */
function generateMetadata(session) {
  const duration = session.updatedAt - session.createdAt;
  const totalTokens = session.tokenUsage ? session.tokenUsage.input + session.tokenUsage.output : 0;

  return `
    <div class="metadata">
      <span>Started: ${formatDateTime(session.createdAt)}</span>
      <span>Duration: ${formatDuration(duration)}</span>
      <span>${session.messageCount || 0} messages</span>
      ${totalTokens > 0 ? `<span>${Math.round(totalTokens / 1000)}k tokens</span>` : ''}
    </div>
  `;
}

/**
 * Generate message content HTML
 * @param {Session} session
 * @param {ExportOptions} opts
 * @returns {string}
 */
function generateContent(session, opts) {
  const events = session.events || [];
  const displayEvents = events.filter((e) => e.type === 'user' || e.type === 'assistant');

  return displayEvents.map((event) => generateMessageHtml(event, opts)).join('\n');
}

/**
 * Generate HTML for a single message
 * @param {Event} event
 * @param {ExportOptions} opts
 * @returns {string}
 */
function generateMessageHtml(event, opts) {
  const role = event.type;
  const content = extractContent(event);
  const toolCalls = event.data?.tool_calls || [];
  const timestamp = event.timestamp;

  // Render markdown content
  const renderedContent = renderMarkdown(content);

  // Generate tool calls HTML
  const toolCallsHtml =
    opts.includeToolOutputs && toolCalls.length > 0 ? toolCalls.map((tc) => generateToolCallHtml(tc, opts)).join('\n') : '';

  return `
    <div class="message message--${role}">
      <div class="message-header">
        <span class="message-role">${role === 'user' ? '👤 User' : '🤖 Assistant'}</span>
        <span class="message-time">${formatDateTime(timestamp)}</span>
      </div>
      <div class="message-content">
        ${renderedContent}
      </div>
      ${toolCallsHtml}
    </div>
  `;
}

/**
 * Generate HTML for a tool call
 * @param {Object} toolCall
 * @param {ExportOptions} opts
 * @returns {string}
 */
function generateToolCallHtml(toolCall, opts) {
  const name = toolCall.name || 'Unknown Tool';
  const input = toolCall.input ? JSON.stringify(toolCall.input, null, 2) : '';
  const output = toolCall.output ? (typeof toolCall.output === 'string' ? toolCall.output : JSON.stringify(toolCall.output, null, 2)) : '';

  return `
    <div class="tool-call">
      <div class="tool-call-header">🔧 ${escapeHtml(name)}</div>
      ${input ? `<div class="tool-call-input"><pre><code>${escapeHtml(input)}</code></pre></div>` : ''}
      ${output && opts.includeToolOutputs ? `<div class="tool-call-output"><pre><code>${escapeHtml(truncateOutput(output))}</code></pre></div>` : ''}
    </div>
  `;
}

/**
 * Extract text content from event data
 * @param {Event} event
 * @returns {string}
 */
function extractContent(event) {
  const content = event.data?.content || event.data?.message || '';

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n\n');
  }

  return '';
}

/**
 * Escape HTML special characters
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Truncate long output
 * @param {string} output
 * @param {number} [maxLength=2000]
 * @returns {string}
 */
function truncateOutput(output, maxLength = 2000) {
  if (output.length <= maxLength) return output;
  return output.slice(0, maxLength) + '\n... (truncated)';
}

/**
 * Generate filename for export
 * @param {Session} session
 * @returns {string}
 */
export function generateExportFilename(session) {
  const date = new Date(session.createdAt);
  const dateStr = date.toISOString().split('T')[0];
  const projectSlug = (session.projectName || 'session').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 30);
  const summarySlug = (session.summary || 'untitled')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase()
    .slice(0, 40);

  return `claude-trace-${dateStr}-${projectSlug}-${summarySlug}.html`;
}

export default { exportSessionToHtml, generateExportFilename };
