/**
 * Index Manager Service
 * Manages session index cache for fast loading
 *
 * Note: This service manages the cache index stored in the renderer process (IndexedDB).
 * The main process coordinates cache operations via IPC.
 */

import type { SessionSummary, ScanResult } from './session-scanner.js';

export interface IndexState {
  lastScanTime: number;
  sessionCount: number;
  version: string;
}

// In-memory cache for quick access (main process)
let cachedSessions: SessionSummary[] = [];
let lastScanTime = 0;
const CACHE_VERSION = '1.0.0';

/**
 * Get cached sessions
 */
export function getCachedSessions(): SessionSummary[] {
  return cachedSessions;
}

/**
 * Update the session cache
 */
export function updateCache(sessions: SessionSummary[]): void {
  cachedSessions = sessions;
  lastScanTime = Date.now();
}

/**
 * Get index state
 */
export function getIndexState(): IndexState {
  return {
    lastScanTime,
    sessionCount: cachedSessions.length,
    version: CACHE_VERSION
  };
}

/**
 * Check if cache is stale (older than 5 minutes)
 */
export function isCacheStale(): boolean {
  const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  return Date.now() - lastScanTime > STALE_THRESHOLD;
}

/**
 * Clear the cache
 */
export function clearCache(): void {
  cachedSessions = [];
  lastScanTime = 0;
}

/**
 * Get a session summary by UUID
 */
export function getSessionSummary(uuid: string): SessionSummary | undefined {
  return cachedSessions.find((s) => s.uuid === uuid);
}

/**
 * Add or update a session in the cache
 */
export function upsertSession(session: SessionSummary): void {
  const index = cachedSessions.findIndex((s) => s.uuid === session.uuid);
  if (index >= 0) {
    cachedSessions[index] = session;
  } else {
    cachedSessions.push(session);
  }
}

/**
 * Remove a session from the cache
 */
export function removeSession(uuid: string): void {
  cachedSessions = cachedSessions.filter((s) => s.uuid !== uuid);
}

/**
 * Get sessions filtered by project path
 */
export function getSessionsByProject(projectPath: string): SessionSummary[] {
  return cachedSessions.filter((s) => s.projectPath === projectPath);
}

/**
 * Get unique project paths
 */
export function getProjectPaths(): string[] {
  const paths = new Set<string>();
  cachedSessions.forEach((s) => paths.add(s.projectPath));
  return Array.from(paths);
}

/**
 * Merge scan results into cache (incremental update)
 */
export function mergeResults(result: ScanResult): SessionSummary[] {
  const existingMap = new Map(cachedSessions.map((s) => [s.uuid, s]));

  // Update or add new sessions
  for (const session of result.sessions) {
    existingMap.set(session.uuid, session);
  }

  cachedSessions = Array.from(existingMap.values());
  lastScanTime = Date.now();

  return cachedSessions;
}

export default {
  getCachedSessions,
  updateCache,
  getIndexState,
  isCacheStale,
  clearCache,
  getSessionSummary,
  upsertSession,
  removeSession,
  getSessionsByProject,
  getProjectPaths,
  mergeResults
};
