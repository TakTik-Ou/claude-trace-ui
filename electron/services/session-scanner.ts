/**
 * Session Scanner Service
 * Scans ~/.claude/projects for session files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

export interface SessionSummary {
  uuid: string;
  summary: string;
  projectName: string;
  projectPath: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  totalTokens: number;
  duration: number;
  filePath: string;
}

export interface ScanResult {
  sessions: SessionSummary[];
  scannedPaths: number;
  duration: number;
}

export interface ScanProgress {
  currentPath: string;
  sessionsFound: number;
  progress: number;
}

/**
 * Get the Claude projects directory path
 * Supports CLAUDE_PROJECTS_PATH environment variable for custom locations
 */
export function getClaudeProjectsPath(): string {
  // Allow custom path via environment variable (for backups, testing, etc.)
  const customPath = process.env.CLAUDE_PROJECTS_PATH;
  if (customPath) {
    return customPath;
  }
  return path.join(homedir(), '.claude', 'projects');
}

/**
 * Scan for session files in the Claude projects directory
 */
export async function scanForSessions(
  onProgress?: (progress: ScanProgress) => void
): Promise<ScanResult> {
  const startTime = Date.now();
  const projectsPath = getClaudeProjectsPath();
  const sessions: SessionSummary[] = [];
  let scannedPaths = 0;

  try {
    // Check if directory exists
    await fs.access(projectsPath);
  } catch {
    console.log('Claude projects directory not found:', projectsPath);
    return { sessions: [], scannedPaths: 0, duration: Date.now() - startTime };
  }

  // Get all project directories
  const projectDirs = await getProjectDirectories(projectsPath);
  const totalDirs = projectDirs.length;

  for (const [index, projectDir] of projectDirs.entries()) {
    const projectPath = projectDir.path;
    const projectName = projectDir.name;

    try {
      // Look for .jsonl files directly in each project directory
      const entries = await fs.readdir(projectPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip directories and non-jsonl files
        if (entry.isDirectory()) continue;
        if (!entry.name.endsWith('.jsonl')) continue;

        const sessionFilePath = path.join(projectPath, entry.name);

        try {
          // Parse minimal session info
          const summary = await parseSessionSummary(sessionFilePath, projectName, projectPath);
          if (summary) {
            sessions.push(summary);
          }
        } catch (err) {
          console.warn(`Error parsing session file ${sessionFilePath}:`, err);
        }

        scannedPaths++;
      }
    } catch (err) {
      console.warn(`Error scanning project directory ${projectPath}:`, err);
    }

    // Report progress
    if (onProgress) {
      onProgress({
        currentPath: projectPath,
        sessionsFound: sessions.length,
        progress: Math.round(((index + 1) / totalDirs) * 100)
      });
    }
  }

  // Sort by creation date (newest first)
  sessions.sort((a, b) => b.createdAt - a.createdAt);

  return {
    sessions,
    scannedPaths,
    duration: Date.now() - startTime
  };
}

/**
 * Get all project directories, handling encoded paths
 */
async function getProjectDirectories(
  projectsPath: string
): Promise<Array<{ path: string; name: string }>> {
  const results: Array<{ path: string; name: string }> = [];

  try {
    const entries = await fs.readdir(projectsPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const fullPath = path.join(projectsPath, entry.name);

      // Decode the directory name (Claude encodes paths)
      const decodedName = decodeProjectName(entry.name);

      results.push({
        path: fullPath,
        name: decodedName
      });
    }
  } catch (err) {
    console.error('Error reading projects directory:', err);
  }

  return results;
}

/**
 * Decode encoded project directory name
 * Claude encodes paths like /Users/name/project as -Users-name-project
 */
function decodeProjectName(encodedName: string): string {
  // Replace leading dash and subsequent dashes with path separators
  // Then extract just the project name (last segment)
  const decoded = encodedName.replace(/^-/, '/').replace(/-/g, '/');
  return path.basename(decoded) || encodedName;
}

/**
 * Parse minimal session summary from journal.jsonl
 * Only reads first and last lines for efficiency
 */
async function parseSessionSummary(
  filePath: string,
  projectName: string,
  projectPath: string
): Promise<SessionSummary | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter((l) => l.trim());

    if (lines.length === 0) return null;

    // Parse first line for metadata
    const firstEvent = JSON.parse(lines[0]);
    const lastEvent = lines.length > 1 ? JSON.parse(lines[lines.length - 1]) : firstEvent;

    // Extract UUID from filename (e.g., "abc123.jsonl" -> "abc123")
    const uuid = path.basename(filePath, '.jsonl');

    // Get summary from summary event or first user message
    let summary = 'Untitled Session';
    let messageCount = 0;
    let totalTokens = 0;

    for (const line of lines) {
      try {
        const event = JSON.parse(line);

        if (event.type === 'summary' && event.summary) {
          summary = event.summary;
        }

        if (event.type === 'user' || event.type === 'assistant') {
          messageCount++;
        }

        if (event.type === 'assistant' && event.usage) {
          totalTokens += (event.usage.input || 0) + (event.usage.output || 0);
        }
      } catch {
        // Skip malformed lines
      }
    }

    // Parse timestamps - could be ISO string or numeric
    const parseTimestamp = (ts: unknown): number => {
      if (typeof ts === 'number') return ts;
      if (typeof ts === 'string') return new Date(ts).getTime();
      return Date.now();
    };

    const createdAt = parseTimestamp(firstEvent.timestamp);
    const updatedAt = parseTimestamp(lastEvent.timestamp) || createdAt;

    return {
      uuid,
      summary: summary.slice(0, 200), // Truncate for list view
      projectName,
      projectPath,
      createdAt,
      updatedAt,
      messageCount,
      totalTokens,
      duration: updatedAt - createdAt,
      filePath
    };
  } catch (err) {
    console.warn(`Error parsing session ${filePath}:`, err);
    return null;
  }
}

export default {
  scanForSessions,
  getClaudeProjectsPath
};
