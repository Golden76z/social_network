// electron/preload.ts
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you need here
});