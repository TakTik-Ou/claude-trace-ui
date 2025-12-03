/**
 * Parse Worker
 * Background worker for parsing JSONL files using Piscina
 *
 * This worker is designed to be run in a thread pool for parallel parsing
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Event types (duplicated to avoid cross-module issues in worker)
type EventType =
  | 'summary'
  | 'user'
  | 'assistant'
  | 'tool_use'
  | 'tool_result'
  | 'file-history-snapshot'
  | 'system-reminder'
  | 'budget'
  | 'unknown';

interface Event {
  type: EventType;
  timestamp: number;
  data: Record<string, unknown>;
}

interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cacheWrite: number | null;
  cacheRead: number | null;
}

interface Session {
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

interface ParseTask {
  filePath: string;
  batchSize?: number;
}

interface ParseResult {
  success: boolean;
  session?: Session;
  errors: string[];
}

/**
 * Main worker function
 * Parses a JSONL file and returns the parsed session
 */
export default async function parseSession(task: ParseTask): Promise<ParseResult> {
  const { filePath, batchSize = 1000 } = task;
  const errors: string[] = [];
  const events: Event[] = [];

  // Metadata extraction
  let uuid = path.basename(path.dirname(filePath));
  let summary = 'Untitled Session';
  let projectPath = '';
  let projectName = '';
  let gitBranch: string | null = null;
  let gitStatus: string | null = null;
  let claudeCodeVersion = 'unknown';
  let workingDirectory = '';

  const tokenUsage: TokenUsage = {
    input: 0,
    output: 0,
    total: 0,
    cacheWrite: null,
    cacheRead: null
  };

  let messageCount = 0;
  let createdAt = 0;
  let updatedAt = 0;

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter((l) => l.trim());

    // Extract project info from path
    const pathParts = filePath.split(path.sep);
    const projectsIndex = pathParts.findIndex((p) => p === 'projects');
    if (projectsIndex >= 0 && pathParts[projectsIndex + 1]) {
      const encodedProject = pathParts[projectsIndex + 1];
      projectPath = encodedProject.replace(/^-/, '/').replace(/-/g, '/');
      projectName = path.basename(projectPath);
    }

    // Process lines in batches
    for (let batchStart = 0; batchStart < lines.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, lines.length);
      const batch = lines.slice(batchStart, batchEnd);

      for (let i = 0; i < batch.length; i++) {
        const lineIndex = batchStart + i;
        const line = batch[i];

        try {
          const rawEvent = JSON.parse(line);
          const event = normalizeEvent(rawEvent);
          events.push(event);

          // Track timestamps
          if (event.timestamp) {
            if (createdAt === 0 || event.timestamp < createdAt) {
              createdAt = event.timestamp;
            }
            if (event.timestamp > updatedAt) {
              updatedAt = event.timestamp;
            }
          }

          // Extract metadata
          processEventMetadata(event, {
            onSummary: (s, meta) => {
              summary = s;
              if (meta) {
                if (meta.uuid) uuid = meta.uuid as string;
                if (meta.version) claudeCodeVersion = meta.version as string;
                if (meta.workingDirectory) workingDirectory = meta.workingDirectory as string;
                if (meta.gitBranch !== undefined) gitBranch = meta.gitBranch as string | null;
              }
            },
            onMessage: () => {
              messageCount++;
            },
            onTokens: (usage) => {
              tokenUsage.input += usage.input || 0;
              tokenUsage.output += usage.output || 0;
              if (usage.cacheWrite) {
                tokenUsage.cacheWrite = (tokenUsage.cacheWrite || 0) + usage.cacheWrite;
              }
              if (usage.cacheRead) {
                tokenUsage.cacheRead = (tokenUsage.cacheRead || 0) + usage.cacheRead;
              }
            }
          });
        } catch (err) {
          errors.push(`Line ${lineIndex + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
        }
      }
    }

    tokenUsage.total = tokenUsage.input + tokenUsage.output;

    const session: Session = {
      uuid,
      projectPath,
      projectName,
      summary,
      createdAt: createdAt || Date.now(),
      updatedAt: updatedAt || createdAt || Date.now(),
      messageCount,
      tokenUsage,
      gitBranch,
      gitStatus,
      claudeCodeVersion,
      workingDirectory,
      events
    };

    return { success: true, session, errors };
  } catch (err) {
    errors.push(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return { success: false, errors };
  }
}

/**
 * Normalize event type
 */
function normalizeEventType(type: string | undefined): EventType {
  const knownTypes: EventType[] = [
    'summary', 'user', 'assistant', 'tool_use', 'tool_result',
    'file-history-snapshot', 'system-reminder', 'budget'
  ];
  return type && knownTypes.includes(type as EventType)
    ? (type as EventType)
    : 'unknown';
}

/**
 * Normalize raw event to Event structure
 */
function normalizeEvent(raw: Record<string, unknown>): Event {
  const type = normalizeEventType(raw.type as string);
  const timestamp = (raw.timestamp as number) || Date.now();

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key !== 'type' && key !== 'timestamp') {
      data[key] = value;
    }
  }

  return { type, timestamp, data };
}

/**
 * Process event metadata
 */
interface MetadataCallbacks {
  onSummary: (summary: string, metadata?: Record<string, unknown>) => void;
  onMessage: () => void;
  onTokens: (usage: { input?: number; output?: number; cacheWrite?: number; cacheRead?: number }) => void;
}

function processEventMetadata(event: Event, callbacks: MetadataCallbacks): void {
  switch (event.type) {
    case 'summary': {
      const data = event.data as { summary?: string; metadata?: Record<string, unknown> };
      if (data.summary) {
        callbacks.onSummary(data.summary, data.metadata);
      }
      break;
    }
    case 'user':
      callbacks.onMessage();
      break;
    case 'assistant': {
      callbacks.onMessage();
      const data = event.data as {
        usage?: { input?: number; output?: number; cache_creation?: number; cache_read?: number }
      };
      if (data.usage) {
        callbacks.onTokens({
          input: data.usage.input,
          output: data.usage.output,
          cacheWrite: data.usage.cache_creation,
          cacheRead: data.usage.cache_read
        });
      }
      break;
    }
  }
}
