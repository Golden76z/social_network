import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';

let mainWindow: BrowserWindow | null = null;
const isDevelopment = process.env.NODE_ENV === 'development';

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    show: false,
    autoHideMenuBar: true,
  });

  const loadApp = () => {
    if (isDevelopment) {
      // Development: Load from Next.js dev server
      mainWindow?.loadURL('http://localhost:3000')
        .catch(err => console.error('Failed to load dev server:', err));
    } else {
      // Production: Load from built files
      const prodPath = join(__dirname, '../dist/index.html');
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
      shell.openExternal(url);
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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});