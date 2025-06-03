"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Add any APIs you want to expose to your React app here
    platform: process.platform,
    // Example IPC methods
    // invoke: (channel: string, data?: any) => ipcRenderer.invoke(channel, data),
    // on: (channel: string, callback: Function) => ipcRenderer.on(channel, callback),
});
