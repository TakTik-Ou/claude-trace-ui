import { contextBridge, ipcRenderer } from 'electron';

/**
 * Secure IPC bridge for renderer process
 * Exposes only necessary APIs to the renderer
 */

// Type-safe channel validation
const validChannels = {
  invoke: [
    'session:scan',
    'session:load',
    'session:export',
    'session:export-batch',
    'preferences:get',
    'preferences:set'
  ] as const,
  on: [
    'session:scan-progress',
    'session:parse-progress'
  ] as const
};

type InvokeChannel = typeof validChannels.invoke[number];
type OnChannel = typeof validChannels.on[number];

// Export types
interface ExportData {
  html: string;
  filename: string;
}

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Invoke an IPC channel and wait for response
   */
  invoke: async <T>(channel: InvokeChannel, ...args: unknown[]): Promise<T> => {
    if (!validChannels.invoke.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  /**
   * Listen to an IPC channel
   */
  on: (channel: OnChannel, callback: (...args: unknown[]) => void): (() => void) => {
    if (!validChannels.on.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      callback(...args);
    };
    ipcRenderer.on(channel, subscription);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  /**
   * Export single session to HTML file
   */
  exportSession: async (data: ExportData): Promise<{ success: boolean; path?: string }> => {
    return ipcRenderer.invoke('session:export', data);
  },

  /**
   * Export multiple sessions to HTML files
   */
  exportSessions: async (exports: ExportData[]): Promise<{ success: boolean; count: number; directory?: string }> => {
    return ipcRenderer.invoke('session:export-batch', exports);
  },

  /**
   * Platform information
   */
  platform: process.platform,

  /**
   * App version
   */
  version: process.env.npm_package_version || '0.1.0'
});

// Type declaration for renderer process
declare global {
  interface Window {
    electronAPI: {
      invoke: <T>(channel: InvokeChannel, ...args: unknown[]) => Promise<T>;
      on: (channel: OnChannel, callback: (...args: unknown[]) => void) => () => void;
      exportSession: (data: ExportData) => Promise<{ success: boolean; path?: string }>;
      exportSessions: (exports: ExportData[]) => Promise<{ success: boolean; count: number; directory?: string }>;
      platform: NodeJS.Platform;
      version: string;
    };
  }
}
