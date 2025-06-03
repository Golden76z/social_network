"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
let mainWindow = null;
const isDevelopment = process.env.NODE_ENV === 'development';
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, 'preload.js'),
        },
        show: false,
        autoHideMenuBar: true,
    });
    const loadApp = () => {
        if (isDevelopment) {
            // Development: Load from Next.js dev server
            mainWindow?.loadURL('http://localhost:3000')
                .catch(err => console.error('Failed to load dev server:', err));
        }
        else {
            // Production: Load from built files
            const prodPath = (0, path_1.join)(__dirname, '../dist/index.html');
            mainWindow?.loadFile(prodPath)
                .catch(err => {
                console.error('Failed to load production build:', err);
                // Fallback to dev server if production build fails
                if (isDevelopment) {
                    mainWindow?.loadURL('http://localhost:3000');
                }
            });
        }
    };
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        if (isDevelopment) {
            // Optional: Open DevTools in development
            mainWindow?.webContents.openDevTools({ mode: 'detach' });
        }
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Open external links in default browser
        if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
            electron_1.shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Load the app
    loadApp();
};
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
