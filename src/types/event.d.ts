/**
 * Event type definitions
 * Based on Claude Code JSONL format from ~/.claude/projects
 */

/**
 * All possible event types in JSONL files
 */
export type EventType =
  | 'summary'
  | 'user'
  | 'assistant'
  | 'tool_use'
  | 'tool_result'
  | 'file-history-snapshot'
  | 'system-reminder'
  | 'budget'
  | 'unknown';

/**
 * Base event structure
 */
export interface BaseEvent {
  /** Event type identifier */
  type: EventType;
  /** Unix timestamp in milliseconds */
  timestamp: number;
}

/**
 * Session summary event (typically first event)
 */
export interface SummaryEvent extends BaseEvent {
  type: 'summary';
  /** Session summary text */
  summary: string;
  /** Session metadata */
  metadata?: {
    uuid?: string;
    version?: string;
    workingDirectory?: string;
    gitBranch?: string | null;
  };
}

/**
 * User message event
 */
export interface UserEvent extends BaseEvent {
  type: 'user';
  /** User message content */
  content: string;
}

/**
 * Assistant response event
 */
export interface AssistantEvent extends BaseEvent {
  type: 'assistant';
  /** Assistant message content */
  content: string;
  /** Token usage for this response */
  usage?: {
    input?: number;
    output?: number;
    cache_creation?: number;
    cache_read?: number;
  };
}

/**
 * Tool invocation event
 */
export interface ToolUseEvent extends BaseEvent {
  type: 'tool_use';
  /** Unique tool use identifier */
  tool_use_id: string;
  /** Tool name */
  name: string;
  /** Tool input parameters */
  parameters: Record<string, unknown>;
}

/**
 * Tool execution result event
 */
export interface ToolResultEvent extends BaseEvent {
  type: 'tool_result';
  /** Matching tool_use_id */
  tool_use_id: string;
  /** Tool output data */
  output?: string | Record<string, unknown>;
  /** Error message if tool failed */
  error?: string;
}

/**
 * File state snapshot event
 */
export interface FileHistorySnapshotEvent extends BaseEvent {
  type: 'file-history-snapshot';
  /** Array of file snapshots */
  files: Array<{
    path: string;
    content: string;
    operation?: 'read' | 'write' | 'edit';
  }>;
}

/**
 * System reminder event
 */
export interface SystemReminderEvent extends BaseEvent {
  type: 'system-reminder';
  /** Reminder content */
  content: string;
}

/**
 * Token budget event
 */
export interface BudgetEvent extends BaseEvent {
  type: 'budget';
  /** Tokens used */
  used: number;
  /** Total budget */
  total: number;
}

/**
 * Unknown/unrecognized event (graceful degradation)
 */
export interface UnknownEvent extends BaseEvent {
  type: 'unknown';
  /** Original event type */
  originalType: string;
  /** Raw event data */
  raw: Record<string, unknown>;
}

/**
 * Union type of all possible events
 */
export type Event =
  | SummaryEvent
  | UserEvent
  | AssistantEvent
  | ToolUseEvent
  | ToolResultEvent
  | FileHistorySnapshotEvent
  | SystemReminderEvent
  | BudgetEvent
  | UnknownEvent;

/**
 * Message representation (user/assistant exchange)
 */
export interface Message {
  /** Generated ID (event index or hash) */
  id: string;
  /** Message role */
  role: 'user' | 'assistant';
  /** Message content (may contain markdown) */
  content: string;
  /** Message timestamp */
  timestamp: number;
  /** Token count (if available) */
  tokenCount: number | null;
  /** Tool calls in this message turn */
  toolCalls: ToolCall[];
  /** Additional event properties */
  metadata: Record<string, unknown>;
}

/**
 * Tool call with parameters and result
 */
export interface ToolCall {
  /** Tool use ID */
  id: string;
  /** Tool name */
  toolName: string;
  /** Input parameters */
  parameters: Record<string, unknown>;
  /** Tool result (if completed) */
  result: ToolResult | null;
  /** Invocation timestamp */
  timestamp: number;
  /** Execution status */
  status: 'pending' | 'success' | 'error';
}

/**
 * Tool execution result
 */
export interface ToolResult {
  /** Tool output */
  output: string | Record<string, unknown>;
  /** Error message (if failed) */
  error: string | null;
  /** Execution duration in ms */
  duration: number | null;
}
