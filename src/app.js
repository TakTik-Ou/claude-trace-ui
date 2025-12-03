/**
 * App initialization and orchestration
 * Coordinates components and services
 */

import { ipcClient } from './services/ipc-client.js';
import { SessionStore } from './lib/SessionStore.js';
import { SearchIndex } from './lib/SearchIndex.js';
import { KeyboardManager } from './lib/KeyboardManager.js';
import { preferences } from './services/preferences.js';
import { SessionList } from './components/SessionList.js';
import { SessionDetail } from './components/SessionDetail.js';
import { SearchBar } from './components/SearchBar.js';
import { FilterPanel } from './components/FilterPanel.js';
import { ExportDialog } from './components/ExportDialog.js';
import { LoadingIndicator } from './components/LoadingIndicator.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { h, clearChildren } from './utils/dom-helpers.js';

/** @type {SessionStore|null} */
let sessionStore = null;

/** @type {SearchIndex|null} */
let searchIndex = null;

/** @type {SessionList|null} */
let sessionList = null;

/** @type {SessionDetail|null} */
let sessionDetail = null;

/** @type {SearchBar|null} */
let searchBar = null;

/** @type {FilterPanel|null} */
let filterPanel = null;

/** @type {ExportDialog|null} */
let exportDialog = null;

/** @type {LoadingIndicator|null} */
let loadingIndicator = null;

/** @type {ErrorBoundary|null} */
let errorBoundary = null;

/** @type {KeyboardManager|null} */
let keyboardManager = null;

/** @type {string} */
let currentSearchQuery = '';

/**
 * Initialize the application
 */
export async function initApp() {
  console.log('Claude Trace UI initializing...');

  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

  if (isElectron) {
    console.log(`Platform: ${window.electronAPI.platform}`);
    console.log(`Version: ${window.electronAPI.version}`);
  } else {
    console.log('Running in browser mode (limited functionality)');
  }

  // Initialize components
  const appRoot = document.getElementById('app');
  if (!appRoot) {
    console.error('App root element not found');
    return;
  }

  // Initialize session store and search index
  sessionStore = new SessionStore();
  searchIndex = new SearchIndex();

  // Apply saved preferences
  preferences.applyTheme();
  preferences.setupThemeListener();

  // Render initial UI
  renderAppLayout(appRoot);

  // Initialize keyboard manager
  initializeKeyboardManager();

  // Set up error boundary
  errorBoundary = new ErrorBoundary(appRoot);
  errorBoundary.on('retry', () => loadSessions(true));

  // Load sessions
  await loadSessions();
}

/**
 * Render the application layout
 * @param {HTMLElement} root - Root element to render into
 */
function renderAppLayout(root) {
  clearChildren(root);

  // Create main layout structure - dark theme
  const layout = h('div', { className: 'flex h-screen bg-gray-900 text-gray-100' });

  // Sidebar (session list)
  const sidebar = h('aside', {
    id: 'session-sidebar',
    className: 'w-80 border-r border-gray-700 bg-gray-900 flex flex-col'
  });

  // Sidebar header with search
  const sidebarHeader = h('header', { className: 'p-4 border-b border-gray-700' }, [
    h('h1', { className: 'text-lg font-semibold text-gray-100 mb-2' }, ['Claude Trace UI'])
  ]);
  sidebar.appendChild(sidebarHeader);

  // Search bar container
  const searchContainer = h('div', { id: 'search-bar', className: 'px-4 pb-2' });
  sidebar.appendChild(searchContainer);

  // Filter panel container
  const filterContainer = h('div', { id: 'filter-panel', className: 'px-4 pb-2 border-b border-gray-700' });
  sidebar.appendChild(filterContainer);

  // Session list container
  const sessionListContainer = h('div', {
    id: 'session-list',
    className: 'flex-1 flex flex-col overflow-hidden'
  });
  sidebar.appendChild(sessionListContainer);

  // Main content area (session detail)
  const mainContent = h('main', {
    id: 'session-detail',
    className: 'flex-1 overflow-hidden bg-gray-850 relative'
  });

  layout.appendChild(sidebar);
  layout.appendChild(mainContent);
  root.appendChild(layout);

  // Initialize components
  initializeComponents(searchContainer, filterContainer, sessionListContainer, mainContent);
}

/**
 * Initialize all UI components
 * @param {HTMLElement} searchContainer
 * @param {HTMLElement} filterContainer
 * @param {HTMLElement} listContainer
 * @param {HTMLElement} detailContainer
 */
function initializeComponents(searchContainer, filterContainer, listContainer, detailContainer) {
  // Initialize search bar
  searchBar = new SearchBar(searchContainer);
  searchBar.on('search', handleSearch);
  searchBar.on('clear', handleSearchClear);

  // Initialize filter panel
  filterPanel = new FilterPanel(filterContainer);
  filterPanel.on('change', handleFilterChange);

  // Initialize session list
  sessionList = new SessionList(listContainer);
  sessionList.on('select', handleSessionSelect);
  sessionList.on('refresh', () => loadSessions(true));

  // Initialize session detail
  sessionDetail = new SessionDetail(detailContainer);
  sessionDetail.on('back', () => {
    // Mobile: show list again
    sessionDetail?.showEmpty();
  });
  sessionDetail.on('export', handleExportSession);

  // Initialize export dialog (append to body for proper z-index)
  const exportDialogContainer = h('div', { id: 'export-dialog-container' });
  document.body.appendChild(exportDialogContainer);
  exportDialog = new ExportDialog(exportDialogContainer);
  exportDialog.on('export-complete', ({ count }) => {
    console.log(`Successfully exported ${count} session(s)`);
  });
  exportDialog.on('export-error', ({ error }) => {
    console.error('Export failed:', error);
  });

  // Initialize loading indicator
  loadingIndicator = new LoadingIndicator(detailContainer, {
    overlay: true,
    showProgress: true
  });

  // Listen for scan progress
  if (window.electronAPI) {
    window.electronAPI.on('session:scan-progress', (progress) => {
      loadingIndicator?.setProgress(progress.progress, `Scanning... ${progress.sessionsFound} sessions found`);
    });
  }
}

/**
 * Load sessions from the main process
 * @param {boolean} [forceRefresh=false]
 */
async function loadSessions(forceRefresh = false) {
  try {
    sessionList?.setLoading(true);
    loadingIndicator?.show('Scanning for sessions...');
    loadingIndicator?.showProgress(true);

    const result = await ipcClient.scanSessions({ forceRefresh });

    console.log(`Loaded ${result.sessions.length} sessions${result.fromCache ? ' (from cache)' : ''}`);

    // Update store
    sessionStore?.setSessions(result.sessions);

    // Build search index
    searchIndex?.clear();
    searchIndex?.addSessions(result.sessions);

    // Update session list
    sessionList?.setSessions(result.sessions);

    // Update filter panel with projects
    const projects = searchIndex?.getProjects() || [];
    filterPanel?.setProjects(projects);

    loadingIndicator?.hide();
    sessionList?.setLoading(false);
  } catch (error) {
    console.error('Failed to load sessions:', error);
    loadingIndicator?.hide();
    sessionList?.setLoading(false);
    errorBoundary?.show({
      message: `Failed to load sessions: ${error.message}`,
      recoverable: true
    });
  }
}

/**
 * Handle session selection
 * @param {import('./types/session').SessionSummary} summary
 */
async function handleSessionSelect(summary) {
  try {
    sessionDetail?.setLoading(true);

    const session = await ipcClient.loadSession(summary.filePath);

    sessionDetail?.setSession(session);
  } catch (error) {
    console.error('Failed to load session:', error);
    sessionDetail?.setError(`Failed to load session: ${error.message}`);
  }
}

/**
 * Handle export session request
 * @param {import('./types/session').Session} session
 */
function handleExportSession(session) {
  if (session && exportDialog) {
    exportDialog.openForSession(session);
  }
}

/**
 * Handle search query
 * @param {{ query: string }} params
 */
function handleSearch({ query }) {
  currentSearchQuery = query;
  performSearchAndFilter();
}

/**
 * Handle search clear
 */
function handleSearchClear() {
  currentSearchQuery = '';
  performSearchAndFilter();
}

/**
 * Handle filter changes
 * @param {import('./components/FilterPanel').FilterState} filters
 */
function handleFilterChange(filters) {
  performSearchAndFilter();
}

/**
 * Perform search and filter operation
 */
function performSearchAndFilter() {
  if (!searchIndex) return;

  const filters = filterPanel?.getFilters() || {};
  const startTime = performance.now();

  // Use SearchIndex for combined search + filter
  const results = searchIndex.search(currentSearchQuery, {
    projectName: filters.projectName,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  });

  // Map results to session summaries
  const sessions = results.map((r) => searchIndex.getSession(r.sessionId)).filter(Boolean);

  const duration = performance.now() - startTime;
  console.log(`Search completed in ${duration.toFixed(2)}ms: ${sessions.length} results`);

  // Update session list
  sessionList?.setSessions(sessions);
}

/**
 * Initialize keyboard manager with shortcuts
 */
function initializeKeyboardManager() {
  keyboardManager = new KeyboardManager();

  // Register keyboard shortcuts
  keyboardManager.register('search', { key: 'k', ctrl: true, description: 'Global search' }, () => {
    searchBar?.focus();
  });

  keyboardManager.register('find', { key: 'f', ctrl: true, description: 'Find in session' }, () => {
    sessionDetail?.searchComponent?.show();
  });

  keyboardManager.register('refresh', { key: 'r', ctrl: true, description: 'Refresh sessions' }, () => {
    loadSessions(true);
  });

  keyboardManager.register('escape', { key: 'Escape', when: 'always' }, () => {
    searchBar?.clear();
    sessionDetail?.searchComponent?.hide();
  });

  // List navigation
  keyboardManager.on('navigate', ({ direction }) => {
    sessionList?.navigate(direction);
  });

  keyboardManager.on('select', () => {
    sessionList?.confirmSelection();
  });

  // Set default context
  keyboardManager.setContext('session-list');
}

/**
 * Cleanup on window unload
 */
window.addEventListener('beforeunload', () => {
  sessionList?.destroy();
  sessionDetail?.destroy();
  searchBar?.destroy();
  filterPanel?.destroy();
  exportDialog?.destroy();
  loadingIndicator?.destroy();
  errorBoundary?.destroy();
  keyboardManager?.destroy();
});

export { sessionStore, searchIndex, sessionList, sessionDetail, preferences };
