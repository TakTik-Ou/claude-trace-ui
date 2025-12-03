import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { scanForSessions, getClaudeProjectsPath, type SessionSummary } from './services/session-scanner.js';
import { parseSessionFile } from './services/jsonl-parser.js';
import * as indexManager from './services/index-manager.js';

// Export data type from renderer
interface ExportData {
  html: string;
  filename: string;
}

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
    const claudeProjectsPath = getClaudeProjectsPath();
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

// session:export - Export single session to HTML file
ipcMain.handle('session:export', async (_event, data: ExportData) => {
  try {
    if (!data?.html || !data?.filename) {
      throw new Error('Invalid export data: html and filename required');
    }

    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Export Session',
      defaultPath: path.join(app.getPath('documents'), data.filename),
      filters: [
        { name: 'HTML Files', extensions: ['html'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    // Write the HTML file
    await fs.writeFile(result.filePath, data.html, 'utf-8');

    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('Error exporting session:', error);
    throw error;
  }
});

// session:export-batch - Export multiple sessions to a directory
ipcMain.handle('session:export-batch', async (_event, exports: ExportData[]) => {
  try {
    if (!exports?.length) {
      throw new Error('No sessions to export');
    }

    // Show directory selection dialog
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select Export Directory',
      defaultPath: app.getPath('documents'),
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true, count: 0 };
    }

    const directory = result.filePaths[0];
    let successCount = 0;

    // Write each session to the directory
    for (const exportData of exports) {
      try {
        const filePath = path.join(directory, exportData.filename);
        await fs.writeFile(filePath, exportData.html, 'utf-8');
        successCount++;
      } catch (err) {
        console.error(`Failed to export ${exportData.filename}:`, err);
      }
    }

    return { success: true, count: successCount, directory };
  } catch (error) {
    console.error('Error batch exporting sessions:', error);
    throw error;
  }
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
