# Data Model: Claude Code Session Browser

**Feature**: 001-session-browser
**Date**: 2025-11-29
**Source**: Derived from spec.md Key Entities and Claude Code JSONL format

---

## Core Entities

### Session

Represents a complete Claude Code conversation with all metadata.

**Properties**:
- `uuid`: string (unique identifier, from journal.jsonl metadata)
- `projectPath`: string (absolute path to project directory)
- `projectName`: string (derived from directory name)
- `summary`: string (conversation summary, from summary event)
- `createdAt`: number (Unix timestamp ms, first event)
- `updatedAt`: number (Unix timestamp ms, last event)
- `messageCount`: number (total user + assistant messages)
- `tokenUsage`: TokenUsage (cumulative token counts)
- `gitBranch`: string | null (git branch at session start)
- `gitStatus`: string | null (git status summary)
- `claudeCodeVersion`: string (version from metadata)
- `workingDirectory`: string (cwd from metadata)
- `events`: Event[] (ordered list of all JSONL events)

**Relationships**:
- Contains many Messages (user/assistant exchanges)
- Contains many ToolCalls (tool invocations + results)
- Belongs to one ProjectDirectory
- Contains many FileSnapshots

**Validation Rules**:
- `uuid` must be valid UUID v4 format
- `projectPath` must be absolute path
- `createdAt` <= `updatedAt`
- `messageCount` >= 0
- `events` array chronologically ordered by timestamp

**State Transitions**:
- None (sessions are immutable, read-only)

---

### Message

Individual conversation turn between user and assistant.

**Properties**:
- `id`: string (generated, event index or hash)
- `role`: 'user' | 'assistant'
- `content`: string (message text, may contain markdown)
- `timestamp`: number (Unix timestamp ms)
- `tokenCount`: number | null (tokens for this message)
- `toolCalls`: ToolCall[] (tools invoked in this turn)
- `metadata`: Record<string, any> (additional event properties)

**Relationships**:
- Belongs to one Session
- Contains zero or more ToolCalls

**Validation Rules**:
- `role` must be 'user' or 'assistant'
- `content` length > 0
- `timestamp` > 0
- `tokenCount` >= 0 if not null

---

### ToolCall

Record of tool invocation with parameters and result.

**Properties**:
- `id`: string (tool_use_id from event)
- `toolName`: string (name of tool invoked)
- `parameters`: Record<string, any> (tool input parameters)
- `result`: ToolResult | null (tool output, may be pending)
- `timestamp`: number (invocation time)
- `status`: 'pending' | 'success' | 'error'

**Nested Type: ToolResult**:
- `output`: string | object (tool output data)
- `error`: string | null (error message if failed)
- `duration`: number | null (execution time ms)

**Relationships**:
- Belongs to one Message (or Session if standalone)
- May have one ToolResult

**Validation Rules**:
- `toolName` non-empty string
- `status` determines result nullability (pending → null, success/error → non-null)

---

### Event

Individual JSONL entry representing discrete action.

**Properties**:
- `type`: EventType
- `timestamp`: number
- `data`: object (type-specific payload)

**EventType Enum**:
- `'summary'`: Session summary event
- `'user'`: User message
- `'assistant'`: Assistant response
- `'tool_use'`: Tool invocation
- `'tool_result'`: Tool output
- `'file-history-snapshot'`: File state capture
- `'system-reminder'`: System-generated context
- `'budget'`: Token budget info
- `'unknown'`: Unrecognized event types (graceful degradation)

**Relationships**:
- Belongs to one Session
- Events ordered by timestamp

**Validation Rules**:
- `timestamp` monotonically increasing within session
- `type` must be valid EventType
- `data` structure varies by type

---

### ProjectDirectory

Organizational unit for sessions belonging to same codebase.

**Properties**:
- `path`: string (absolute path)
- `name`: string (directory name)
- `sessionCount`: number (total sessions)
- `lastActivity`: number (timestamp of most recent session)
- `totalTokens`: number (sum across all sessions)

**Relationships**:
- Contains many Sessions

**Validation Rules**:
- `path` must be valid directory path
- `sessionCount` matches actual session count
- `lastActivity` is max timestamp across sessions

---

### TokenUsage

Token consumption statistics.

**Properties**:
- `input`: number (input tokens)
- `output`: number (output tokens)
- `total`: number (input + output)
- `cacheWrite`: number | null (cache write tokens, if available)
- `cacheRead`: number | null (cache read tokens, if available)

**Validation Rules**:
- All counts >= 0
- `total` === `input` + `output`

---

### FileSnapshot

Captures file state at specific point in session.

**Properties**:
- `filePath`: string (relative or absolute path)
- `content`: string (file contents at snapshot time)
- `timestamp`: number
- `operation`: 'read' | 'write' | 'edit' | 'snapshot'
- `lineCount`: number | null

**Relationships**:
- Belongs to one Session

**Validation Rules**:
- `filePath` non-empty
- `operation` must be valid type

---

## Derived Data (Computed at Runtime)

### SessionSummary (for List View)

Lightweight representation for virtual scrolling.

**Properties**:
- `uuid`: string
- `summary`: string (truncated to 100 chars)
- `projectName`: string
- `createdAt`: number
- `messageCount`: number
- `totalTokens`: number
- `duration`: number (updatedAt - createdAt)

**Source**: Indexed from Session, cached in IndexedDB

---

### SearchIndex (for Fast Filtering)

In-memory search index for <50ms response time.

**Properties**:
- `sessionId`: string (UUID)
- `searchableText`: string (concatenated: summary + messages)
- `projectPath`: string
- `dateRange`: [number, number] (createdAt, updatedAt)
- `tags`: string[] (derived: project name, branch, file types)

**Source**: Built from Session on app load, updated incrementally

---

## JSONL Event Schema Reference

Based on Claude Code `journal.jsonl` format from `~/.claude/projects/*/*/`.

### Example Events

**Summary Event**:
```json
{
  "type": "summary",
  "summary": "Created a new feature for...",
  "timestamp": 1701234567890,
  "metadata": { "uuid": "abc-123", "version": "1.0.0" }
}
```

**User Message Event**:
```json
{
  "type": "user",
  "content": "Please implement X",
  "timestamp": 1701234567900
}
```

**Assistant Message Event**:
```json
{
  "type": "assistant",
  "content": "I'll help you with that...",
  "timestamp": 1701234567910,
  "usage": { "input": 100, "output": 50 }
}
```

**Tool Use Event**:
```json
{
  "type": "tool_use",
  "tool_use_id": "tool_123",
  "name": "Read",
  "parameters": { "file_path": "/path/to/file.ts" },
  "timestamp": 1701234567920
}
```

**Tool Result Event**:
```json
{
  "type": "tool_result",
  "tool_use_id": "tool_123",
  "output": "file contents here...",
  "timestamp": 1701234567930
}
```

---

## Storage Strategy

### IndexedDB Schema

**Object Stores**:

1. **sessions** (keyPath: 'uuid')
   - Stores full Session objects
   - Indexes: projectPath, createdAt, messageCount

2. **sessionSummaries** (keyPath: 'uuid')
   - Stores SessionSummary (lightweight)
   - Used for list view rendering
   - Indexes: projectPath, createdAt

3. **searchIndex** (keyPath: 'sessionId')
   - Stores SearchIndex entries
   - Enables fast keyword filtering

4. **preferences** (keyPath: 'key')
   - Stores user preferences (sort order, filters, etc.)

### Cache Strategy

- **On app launch**: Load sessionSummaries into memory (<50MB for 1000 sessions)
- **On demand**: Load full Session from IndexedDB when detail view opened
- **Incremental update**: When new sessions detected, parse and add to index
- **Eviction**: LRU cache for full sessions (keep max 10 in memory)

---

## Data Flow

### Session Loading

```
1. App Launch
   ↓
2. Scan ~/.claude/projects for journal.jsonl files
   ↓
3. For each file: Read metadata (first/last line)
   ↓
4. Build SessionSummary objects
   ↓
5. Cache in IndexedDB + in-memory
   ↓
6. Render list view (virtual scroll)
```

### Session Detail View

```
1. User clicks session
   ↓
2. Check memory cache
   ↓
3. If not cached: Load from IndexedDB
   ↓
4. If not in IndexedDB: Parse JSONL file
   ↓
5. Build full Session object
   ↓
6. Cache in memory + IndexedDB
   ↓
7. Render detail view
```

### Search/Filter

```
1. User types search term
   ↓
2. Query in-memory SearchIndex
   ↓
3. Filter sessionSummaries
   ↓
4. Re-render virtual list
   ↓
5. <50ms total (constitutional requirement)
```

---

## Type Definitions (TypeScript/JSDoc)

```typescript
// types/session.d.ts

export interface Session {
  uuid: string;
  projectPath: string;
  projectName: string;
  summary: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  tokenUsage: TokenUsage;
  gitBranch: string | null;
  gitStatus: string | null;
  claudeCodeVersion: string;
  workingDirectory: string;
  events: Event[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  tokenCount: number | null;
  toolCalls: ToolCall[];
  metadata: Record<string, any>;
}

export interface ToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  result: ToolResult | null;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
}

export interface ToolResult {
  output: string | object;
  error: string | null;
  duration: number | null;
}

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

export interface Event {
  type: EventType;
  timestamp: number;
  data: object;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cacheWrite: number | null;
  cacheRead: number | null;
}

export interface ProjectDirectory {
  path: string;
  name: string;
  sessionCount: number;
  lastActivity: number;
  totalTokens: number;
}

export interface FileSnapshot {
  filePath: string;
  content: string;
  timestamp: number;
  operation: 'read' | 'write' | 'edit' | 'snapshot';
  lineCount: number | null;
}

export interface SessionSummary {
  uuid: string;
  summary: string;
  projectName: string;
  createdAt: number;
  messageCount: number;
  totalTokens: number;
  duration: number;
}

export interface SearchIndex {
  sessionId: string;
  searchableText: string;
  projectPath: string;
  dateRange: [number, number];
  tags: string[];
}
```

---

**Status**: ✅ COMPLETE
**Next**: Generate API contracts (IPC protocol, export format)
