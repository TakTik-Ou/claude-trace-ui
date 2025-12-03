/**
 * Markdown Renderer - Converts markdown to secure HTML
 * Uses marked for parsing and DOMPurify for sanitization
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for GitHub-flavored markdown
marked.setOptions({
  gfm: true,
  breaks: true
});

/**
 * DOMPurify configuration for secure HTML
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'blockquote',
    'pre', 'code',
    'em', 'strong', 'del', 's',
    'a',
    'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel',
    'src', 'alt', 'width', 'height',
    'class', 'id',
    'data-language', 'data-line'
  ],
  ALLOW_DATA_ATTR: true,
  // Force links to open in new tab
  ADD_ATTR: ['target', 'rel'],
  // Forbid dangerous protocols
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
};

/**
 * Custom renderer for code blocks
 */
const renderer = new marked.Renderer();

// Add language class to code blocks for syntax highlighting
renderer.code = function(code, language) {
  const lang = language || 'plaintext';
  const escaped = escapeHtml(code);
  return `<pre class="code-block" data-language="${lang}"><code class="language-${lang}">${escaped}</code></pre>`;
};

// Add classes to inline code
renderer.codespan = function(code) {
  return `<code class="inline-code">${escapeHtml(code)}</code>`;
};

// Make links open in new tab
renderer.link = function(href, title, text) {
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  return `<a href="${escapeHtml(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

marked.use({ renderer });

/**
 * Escape HTML special characters
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
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
 * Render markdown to secure HTML
 * @param {string} markdown - Markdown text
 * @returns {string} Sanitized HTML
 */
export function renderMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  try {
    // Parse markdown to HTML
    const rawHtml = marked.parse(markdown);

    // Sanitize HTML
    const cleanHtml = DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);

    return cleanHtml;
  } catch (error) {
    console.error('Markdown rendering error:', error);
    // Return escaped plain text as fallback
    return `<pre>${escapeHtml(markdown)}</pre>`;
  }
}

/**
 * Render markdown to DOM element (secure)
 * @param {string} markdown - Markdown text
 * @param {HTMLElement} container - Container element
 */
export function renderMarkdownTo(markdown, container) {
  const html = renderMarkdown(markdown);
  container.innerHTML = html;
}

/**
 * Create a DOM element from markdown (secure)
 * @param {string} markdown - Markdown text
 * @returns {HTMLElement}
 */
export function createMarkdownElement(markdown) {
  const div = document.createElement('div');
  div.className = 'markdown-content';
  div.innerHTML = renderMarkdown(markdown);
  return div;
}

/**
 * Extract code blocks from markdown for syntax highlighting
 * @param {string} markdown - Markdown text
 * @returns {Array<{ code: string, language: string }>}
 */
export function extractCodeBlocks(markdown) {
  const blocks = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    blocks.push({
      language: match[1] || 'plaintext',
      code: match[2].trim()
    });
  }

  return blocks;
}

export const markdownRenderer = {
  renderMarkdown,
  renderMarkdownTo,
  createMarkdownElement,
  extractCodeBlocks
};

export default markdownRenderer;
