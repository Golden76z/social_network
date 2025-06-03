import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you want to expose to your React app here
  platform: process.platform,
  
  // Example IPC methods
  // invoke: (channel: string, data?: any) => ipcRenderer.invoke(channel, data),
  // on: (channel: string, callback: Function) => ipcRenderer.on(channel, callback),
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      platform: string;
      // Add other API method types here
    };
  }
}