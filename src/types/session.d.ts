/**
 * Session type definitions
 * Based on data-model.md specifications
 */

import type { Event } from './event';

/**
 * Token usage statistics for a session
 */
export interface TokenUsage {
  /** Input tokens consumed */
  input: number;
  /** Output tokens generated */
  output: number;
  /** Total tokens (input + output) */
  total: number;
  /** Cache write tokens (if available) */
  cacheWrite: number | null;
  /** Cache read tokens (if available) */
  cacheRead: number | null;
}

/**
 * Complete session object with all metadata and events
 */
export interface Session {
  /** Unique identifier (UUID v4) */
  uuid: string;
  /** Absolute path to project directory */
  projectPath: string;
  /** Directory name derived from projectPath */
  projectName: string;
  /** Conversation summary from summary event */
  summary: string;
  /** Unix timestamp ms of first event */
  createdAt: number;
  /** Unix timestamp ms of last event */
  updatedAt: number;
  /** Total user + assistant messages */
  messageCount: number;
  /** Cumulative token counts */
  tokenUsage: TokenUsage;
  /** Git branch at session start (if available) */
  gitBranch: string | null;
  /** Git status summary (if available) */
  gitStatus: string | null;
  /** Claude Code version from metadata */
  claudeCodeVersion: string;
  /** Working directory from metadata */
  workingDirectory: string;
  /** Ordered list of all JSONL events */
  events: Event[];
}

/**
 * Lightweight session summary for list view (virtual scrolling)
 */
export interface SessionSummary {
  /** Unique identifier */
  uuid: string;
  /** Summary text (truncated to 200 chars) */
  summary: string;
  /** Project directory name */
  projectName: string;
  /** Absolute path to project */
  projectPath: string;
  /** Unix timestamp ms of creation */
  createdAt: number;
  /** Unix timestamp ms of last update */
  updatedAt: number;
  /** Total message count */
  messageCount: number;
  /** Total tokens consumed */
  totalTokens: number;
  /** Session duration in ms (updatedAt - createdAt) */
  duration: number;
  /** File path to the session journal.jsonl */
  filePath: string;
}

/**
 * Project directory organizational unit
 */
export interface ProjectDirectory {
  /** Absolute path to project */
  path: string;
  /** Directory name */
  name: string;
  /** Number of sessions in this project */
  sessionCount: number;
  /** Timestamp of most recent session */
  lastActivity: number;
  /** Sum of tokens across all sessions */
  totalTokens: number;
}

/**
 * Search index entry for fast filtering
 */
export interface SearchIndex {
  /** Session UUID */
  sessionId: string;
  /** Concatenated searchable text (summary + messages) */
  searchableText: string;
  /** Project path for filtering */
  projectPath: string;
  /** Date range [createdAt, updatedAt] */
  dateRange: [number, number];
  /** Derived tags (project name, branch, file types) */
  tags: string[];
}

/**
 * File snapshot captured during session
 */
export interface FileSnapshot {
  /** File path (relative or absolute) */
  filePath: string;
  /** File contents at snapshot time */
  content: string;
  /** Snapshot timestamp */
  timestamp: number;
  /** Operation type */
  operation: 'read' | 'write' | 'edit' | 'snapshot';
  /** Line count (if available) */
  lineCount: number | null;
}
