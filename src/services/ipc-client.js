/**
 * IPC Client - Wrapper for Electron IPC communication
 * Provides type-safe methods for renderer → main process communication
 */

/**
 * @typedef {import('../types/ipc').SessionScanRequest} SessionScanRequest
 * @typedef {import('../types/ipc').SessionScanResponse} SessionScanResponse
 * @typedef {import('../types/ipc').SessionLoadRequest} SessionLoadRequest
 * @typedef {import('../types/ipc').SessionLoadResponse} SessionLoadResponse
 * @typedef {import('../types/ipc').SessionExportRequest} SessionExportRequest
 * @typedef {import('../types/ipc').SessionExportResponse} SessionExportResponse
 * @typedef {import('../types/ipc').ScanProgressEvent} ScanProgressEvent
 * @typedef {import('../types/ipc').ParseProgressEvent} ParseProgressEvent
 */

/**
 * Check if running in Electron environment
 * @returns {boolean}
 */
export function isElectron() {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

/**
 * Scan for sessions in ~/.claude/projects
 * @param {SessionScanRequest} [request]
 * @returns {Promise<SessionScanResponse>}
 */
export async function scanSessions(request = {}) {
  if (!isElectron()) {
    console.warn('scanSessions: Not running in Electron');
    return { sessions: [], scannedPaths: 0, duration: 0 };
  }

  return window.electronAPI.invoke('session:scan', request);
}

/**
 * Load full session details by file path
 * @param {string} filePath - Path to the session journal.jsonl file
 * @returns {Promise<SessionLoadResponse>}
 */
export async function loadSession(filePath) {
  if (!isElectron()) {
    console.warn('loadSession: Not running in Electron');
    return { error: 'Not running in Electron environment' };
  }

  return window.electronAPI.invoke('session:load', filePath);
}

/**
 * Export sessions to HTML files
 * @param {SessionExportRequest} request
 * @returns {Promise<SessionExportResponse>}
 */
export async function exportSessions(request) {
  if (!isElectron()) {
    console.warn('exportSessions: Not running in Electron');
    return { exportedFiles: [], duration: 0 };
  }

  return window.electronAPI.invoke('session:export', request);
}

/**
 * Get a user preference
 * @param {string} key - Preference key
 * @returns {Promise<unknown>}
 */
export async function getPreference(key) {
  if (!isElectron()) {
    // Fallback to localStorage in browser
    const value = localStorage.getItem(`pref:${key}`);
    return value ? JSON.parse(value) : null;
  }

  return window.electronAPI.invoke('preferences:get', { key });
}

/**
 * Set a user preference
 * @param {string} key - Preference key
 * @param {unknown} value - Preference value
 * @returns {Promise<{ success: boolean }>}
 */
export async function setPreference(key, value) {
  if (!isElectron()) {
    // Fallback to localStorage in browser
    localStorage.setItem(`pref:${key}`, JSON.stringify(value));
    return { success: true };
  }

  return window.electronAPI.invoke('preferences:set', { key, value });
}

/**
 * Listen for scan progress events
 * @param {(progress: ScanProgressEvent) => void} callback
 * @returns {() => void} Cleanup function
 */
export function onScanProgress(callback) {
  if (!isElectron()) {
    return () => {};
  }

  return window.electronAPI.on('session:scan-progress', callback);
}

/**
 * Listen for parse progress events
 * @param {(progress: ParseProgressEvent) => void} callback
 * @returns {() => void} Cleanup function
 */
export function onParseProgress(callback) {
  if (!isElectron()) {
    return () => {};
  }

  return window.electronAPI.on('session:parse-progress', callback);
}

/**
 * IPC client instance with all methods
 */
export const ipcClient = {
  isElectron,
  scanSessions,
  loadSession,
  exportSessions,
  getPreference,
  setPreference,
  onScanProgress,
  onParseProgress
};

export default ipcClient;
