/**
 * Syntax Highlighter - Code syntax highlighting using highlight.js
 * Selective import to minimize bundle size (~30KB vs 300KB full)
 */

import hljs from 'highlight.js/lib/core';

// Import only commonly used languages for Claude Code sessions
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml'; // Also handles HTML
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('golang', go);

/**
 * Supported languages for quick lookup
 */
export const SUPPORTED_LANGUAGES = new Set([
  'javascript', 'js', 'typescript', 'ts',
  'python', 'py',
  'json',
  'bash', 'sh', 'shell',
  'css',
  'xml', 'html',
  'markdown', 'md',
  'yaml', 'yml',
  'sql',
  'rust', 'rs',
  'go', 'golang'
]);

/**
 * Highlight code string
 * @param {string} code - Code to highlight
 * @param {string} [language] - Language hint
 * @returns {{ value: string, language: string }}
 */
export function highlightCode(code, language) {
  if (!code || typeof code !== 'string') {
    return { value: escapeHtml(code || ''), language: 'plaintext' };
  }

  try {
    // Normalize language name
    const lang = normalizeLanguage(language);

    if (lang && SUPPORTED_LANGUAGES.has(lang)) {
      const result = hljs.highlight(code, { language: lang, ignoreIllegals: true });
      return { value: result.value, language: lang };
    }

    // Auto-detect if no language specified
    const result = hljs.highlightAuto(code);
    return { value: result.value, language: result.language || 'plaintext' };
  } catch (error) {
    console.warn('Syntax highlighting error:', error);
    return { value: escapeHtml(code), language: 'plaintext' };
  }
}

/**
 * Highlight a code block element in place
 * @param {HTMLElement} element - Code element to highlight
 */
export function highlightElement(element) {
  try {
    hljs.highlightElement(element);
  } catch (error) {
    console.warn('Element highlighting error:', error);
  }
}

/**
 * Highlight all code blocks in a container
 * @param {HTMLElement} container - Container to search for code blocks
 */
export function highlightAllIn(container) {
  const codeBlocks = container.querySelectorAll('pre code');
  codeBlocks.forEach((block) => {
    if (!block.classList.contains('hljs')) {
      highlightElement(block);
    }
  });
}

/**
 * Create a highlighted code element
 * @param {string} code - Code to highlight
 * @param {string} [language] - Language
 * @returns {HTMLElement}
 */
export function createHighlightedElement(code, language) {
  const pre = document.createElement('pre');
  pre.className = 'code-block';

  const codeEl = document.createElement('code');
  const lang = normalizeLanguage(language) || 'plaintext';
  codeEl.className = `language-${lang}`;

  const result = highlightCode(code, lang);
  codeEl.innerHTML = result.value;
  codeEl.dataset.language = result.language;

  pre.appendChild(codeEl);
  pre.dataset.language = result.language;

  return pre;
}

/**
 * Normalize language name to hljs format
 * @param {string} [language]
 * @returns {string | null}
 */
function normalizeLanguage(language) {
  if (!language) return null;

  const lang = language.toLowerCase().trim();

  // Common aliases
  const aliases = {
    'jsx': 'javascript',
    'tsx': 'typescript',
    'node': 'javascript',
    'zsh': 'bash',
    'dockerfile': 'bash',
    'makefile': 'bash',
    'htm': 'html'
  };

  return aliases[lang] || (SUPPORTED_LANGUAGES.has(lang) ? lang : null);
}

/**
 * Escape HTML for safe display
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
 * Get list of supported languages
 * @returns {string[]}
 */
export function getSupportedLanguages() {
  return Array.from(SUPPORTED_LANGUAGES);
}

export const syntaxHighlighter = {
  highlightCode,
  highlightElement,
  highlightAllIn,
  createHighlightedElement,
  getSupportedLanguages,
  SUPPORTED_LANGUAGES
};

export default syntaxHighlighter;
