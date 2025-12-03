/**
 * Type definitions index
 * Re-exports all types for convenient imports
 */

// Session types
export type {
  TokenUsage,
  Session,
  SessionSummary,
  ProjectDirectory,
  SearchIndex,
  FileSnapshot
} from './session';

// Event types
export type {
  EventType,
  BaseEvent,
  SummaryEvent,
  UserEvent,
  AssistantEvent,
  ToolUseEvent,
  ToolResultEvent,
  FileHistorySnapshotEvent,
  SystemReminderEvent,
  BudgetEvent,
  UnknownEvent,
  Event,
  Message,
  ToolCall,
  ToolResult
} from './event';

// IPC types
export type {
  InvokeChannel,
  EventChannel,
  SessionScanRequest,
  SessionScanResponse,
  SessionLoadRequest,
  SessionLoadResponse,
  ExportOptions,
  SessionExportRequest,
  SessionExportResponse,
  PreferenceKey,
  PreferenceValue,
  PreferencesGetRequest,
  PreferencesSetRequest,
  PreferencesSetResponse,
  ScanProgressEvent,
  ParseProgressEvent,
  IPCError
} from './ipc';

export { isIPCError } from './ipc';
