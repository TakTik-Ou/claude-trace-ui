/**
 * JSONL Parser Service
 * Parses Claude Code session JSONL files into structured Session objects
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Types matching src/types/event.d.ts
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
  data: Record<string, unknown>;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cacheWrite: number | null;
  cacheRead: number | null;
}

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

export interface ParseProgress {
  sessionId: string;
  linesParsed: number;
  totalLines: number;
  progress: number;
}

export interface ParseResult {
  session: Session | null;
  errors: string[];
}

/**
 * Parse a JSONL session file into a Session object
 */
export async function parseSessionFile(
  filePath: string,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParseResult> {
  const errors: string[] = [];
  const events: Event[] = [];

  // Metadata to extract - UUID comes from filename
  let uuid = path.basename(filePath, '.jsonl');
  let summary = 'Untitled Session';
  let projectPath = '';
  let projectName = '';
  let gitBranch: string | null = null;
  let gitStatus: string | null = null;
  let claudeCodeVersion = 'unknown';
  let workingDirectory = '';

  // Token tracking
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
    const totalLines = lines.length;

    // Extract project info from path
    const pathParts = filePath.split(path.sep);
    const projectsIndex = pathParts.findIndex((p) => p === 'projects');
    if (projectsIndex >= 0 && pathParts[projectsIndex + 1]) {
      const encodedProject = pathParts[projectsIndex + 1];
      projectPath = encodedProject.replace(/^-/, '/').replace(/-/g, '/');
      projectName = path.basename(projectPath);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

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

        // Extract metadata based on event type
        switch (event.type) {
          case 'summary': {
            const data = event.data as { summary?: string; metadata?: Record<string, unknown> };
            if (data.summary) summary = data.summary;
            if (data.metadata) {
              const meta = data.metadata;
              if (meta.uuid) uuid = meta.uuid as string;
              if (meta.version) claudeCodeVersion = meta.version as string;
              if (meta.workingDirectory) workingDirectory = meta.workingDirectory as string;
              if (meta.gitBranch !== undefined) gitBranch = meta.gitBranch as string | null;
            }
            break;
          }

          case 'user':
          case 'assistant':
            messageCount++;
            if (event.type === 'assistant') {
              const data = event.data as { usage?: { input?: number; output?: number; cache_creation?: number; cache_read?: number } };
              if (data.usage) {
                tokenUsage.input += data.usage.input || 0;
                tokenUsage.output += data.usage.output || 0;
                if (data.usage.cache_creation) {
                  tokenUsage.cacheWrite = (tokenUsage.cacheWrite || 0) + data.usage.cache_creation;
                }
                if (data.usage.cache_read) {
                  tokenUsage.cacheRead = (tokenUsage.cacheRead || 0) + data.usage.cache_read;
                }
              }
            }
            break;
        }
      } catch (err) {
        errors.push(`Line ${i + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
      }

      // Report progress every 100 lines
      if (onProgress && i % 100 === 0) {
        onProgress({
          sessionId: uuid,
          linesParsed: i + 1,
          totalLines,
          progress: Math.round(((i + 1) / totalLines) * 100)
        });
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

    return { session, errors };
  } catch (err) {
    errors.push(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return { session: null, errors };
  }
}

/**
 * Normalize a raw event into a standard Event structure
 */
function normalizeEvent(raw: Record<string, unknown>): Event {
  const type = normalizeEventType(raw.type as string);
  // Parse timestamp - could be ISO string or numeric
  const rawTs = raw.timestamp;
  const timestamp = typeof rawTs === 'string' ? new Date(rawTs).getTime() :
                    typeof rawTs === 'number' ? rawTs : Date.now();

  // Create data object excluding type and timestamp
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key !== 'type' && key !== 'timestamp') {
      data[key] = value;
    }
  }

  return { type, timestamp, data };
}

/**
 * Normalize event type string to known EventType
 */
function normalizeEventType(type: string | undefined): EventType {
  if (!type) return 'unknown';

  const knownTypes: EventType[] = [
    'summary',
    'user',
    'assistant',
    'tool_use',
    'tool_result',
    'file-history-snapshot',
    'system-reminder',
    'budget'
  ];

  if (knownTypes.includes(type as EventType)) {
    return type as EventType;
  }

  return 'unknown';
}

export default {
  parseSessionFile
};
