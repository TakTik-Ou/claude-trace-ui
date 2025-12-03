import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { homedir } from 'os';
import { scanForSessions, type SessionSummary } from './services/session-scanner.js';
import { parseSessionFile } from './services/jsonl-parser.js';
import * as indexManager from './services/index-manager.js';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    titleBarStyle: 'hiddenInset',
    show: false
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });
});

// IPC Handlers

// session:scan - Scan for sessions in ~/.claude/projects
ipcMain.handle('session:scan', async (_event, options?: { forceRefresh?: boolean }) => {
  try {
    const forceRefresh = options?.forceRefresh ?? false;

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = indexManager.getCachedSessions();
      if (cached.length > 0) {
        return { sessions: cached, fromCache: true };
      }
    }

    // Scan for sessions
    const result = await scanForSessions((progress) => {
      // Send progress to renderer
      mainWindow?.webContents.send('session:scan-progress', progress);
    });

    // Update cache
    indexManager.updateCache(result.sessions);

    return {
      sessions: result.sessions,
      scannedPaths: result.scannedPaths,
      duration: result.duration,
      fromCache: false
    };
  } catch (error) {
    console.error('Error scanning sessions:', error);
    throw error;
  }
});

// session:load - Load full session details
ipcMain.handle('session:load', async (_event, filePath: string) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path');
    }

    // Security: Ensure path is within Claude projects directory
    const claudeProjectsPath = path.join(homedir(), '.claude', 'projects');
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(claudeProjectsPath)) {
      throw new Error('Access denied: Path outside Claude projects directory');
    }

    const result = await parseSessionFile(filePath);

    if (!result.session) {
      throw new Error(result.errors.join('; ') || 'Failed to parse session');
    }

    return result.session;
  } catch (error) {
    console.error('Error loading session:', error);
    throw error;
  }
});

// session:export - Export session to HTML (placeholder for future)
ipcMain.handle('session:export', async (_event, _sessionId: string, _format: string) => {
  // Will be implemented in Phase 7
  throw new Error('Export not yet implemented');
});

// preferences:get - Get user preferences (placeholder for future)
ipcMain.handle('preferences:get', async () => {
  // Will be implemented when preferences are needed
  return {};
});

// preferences:set - Set user preferences (placeholder for future)
ipcMain.handle('preferences:set', async (_event, _prefs: Record<string, unknown>) => {
  // Will be implemented when preferences are needed
  return true;
});

export { mainWindow };
