/**
 * IPC Protocol type definitions
 * Based on contracts/ipc-protocol.json
 */

import type { Session, SessionSummary } from './session';

/**
 * Valid IPC channels for invoke (renderer → main)
 */
export type InvokeChannel =
  | 'session:scan'
  | 'session:load'
  | 'session:export'
  | 'preferences:get'
  | 'preferences:set';

/**
 * Valid IPC channels for events (main → renderer)
 */
export type EventChannel =
  | 'session:scan-progress'
  | 'session:parse-progress';

// ============================================================================
// session:scan
// ============================================================================

/**
 * Request to scan for sessions
 */
export interface SessionScanRequest {
  /** Bypass cache and rescan filesystem */
  forceRescan?: boolean;
}

/**
 * Response from session scan
 */
export interface SessionScanResponse {
  /** List of session summaries */
  sessions: SessionSummary[];
  /** Number of paths scanned */
  scannedPaths: number;
  /** Scan duration in ms */
  duration: number;
}

// ============================================================================
// session:load
// ============================================================================

/**
 * Request to load session details
 */
export interface SessionLoadRequest {
  /** Session UUID to load */
  uuid: string;
}

/**
 * Response from session load (full session or error)
 */
export type SessionLoadResponse = Session | IPCError;

// ============================================================================
// session:export
// ============================================================================

/**
 * Export options
 */
export interface ExportOptions {
  /** Include tool outputs in export */
  includeToolOutputs?: boolean;
  /** Enable syntax highlighting */
  syntaxHighlighting?: boolean;
  /** Embed styles in HTML (vs external) */
  embedStyles?: boolean;
}

/**
 * Request to export sessions
 */
export interface SessionExportRequest {
  /** Session UUIDs to export */
  uuids: string[];
  /** Output directory path */
  outputPath: string;
  /** Export options */
  options?: ExportOptions;
}

/**
 * Response from session export
 */
export interface SessionExportResponse {
  /** Paths to exported files */
  exportedFiles: string[];
  /** Export duration in ms */
  duration: number;
}

// ============================================================================
// preferences:get / preferences:set
// ============================================================================

/**
 * User preferences keys
 */
export type PreferenceKey =
  | 'window.size'
  | 'window.position'
  | 'filter.project'
  | 'filter.dateRange'
  | 'sort.field'
  | 'sort.direction'
  | 'lastViewedSession';

/**
 * Preference value types
 */
export type PreferenceValue =
  | { width: number; height: number }
  | { x: number; y: number }
  | string
  | [number, number]
  | 'date' | 'project' | 'duration' | 'tokens'
  | 'asc' | 'desc'
  | string | null;

/**
 * Request to get preference
 */
export interface PreferencesGetRequest {
  /** Preference key */
  key: PreferenceKey;
}

/**
 * Request to set preference
 */
export interface PreferencesSetRequest {
  /** Preference key */
  key: PreferenceKey;
  /** Preference value */
  value: PreferenceValue;
}

/**
 * Response from preference set
 */
export interface PreferencesSetResponse {
  /** Whether the operation succeeded */
  success: boolean;
}

// ============================================================================
// Progress Events
// ============================================================================

/**
 * Scan progress event data
 */
export interface ScanProgressEvent {
  /** Current path being scanned */
  currentPath: string;
  /** Number of sessions found so far */
  sessionsFound: number;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Parse progress event data
 */
export interface ParseProgressEvent {
  /** Session being parsed */
  sessionId: string;
  /** Lines parsed */
  linesParsed: number;
  /** Total lines */
  totalLines: number;
  /** Progress percentage (0-100) */
  progress: number;
}

// ============================================================================
// Error
// ============================================================================

/**
 * IPC error response
 */
export interface IPCError {
  /** Error message */
  error: string;
  /** Error code */
  code?: string;
  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Type guard to check if response is an error
 */
export function isIPCError(response: unknown): response is IPCError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as IPCError).error === 'string'
  );
}
