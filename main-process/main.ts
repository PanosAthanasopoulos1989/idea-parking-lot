
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// In some environments, electron is exported as a string (path to binary)
// We need to find the actual API object.
let electron = require('electron');
if (typeof electron === 'string') {
  console.log('Detected electron-as-string. Attempting to resolve actual API...');
  // This is very strange but let's try to see if it's available elsewhere
  // Actually, maybe it's under a different name or we can get it from process
  // In Electron main process, 'electron' should be a built-in.
}

const { app, BrowserWindow, ipcMain } = electron;

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Main process started.');
console.log('Process type:', process.type);
console.log('App object defined:', !!app);

if (app) {
  app.whenReady().then(() => {
    ipcMain.handle('read-user-data', async () => {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'idea-parking-lot.json');
      try {
        if (fs.existsSync(dbPath)) {
          const data = fs.readFileSync(dbPath, 'utf-8');
          return JSON.parse(data);
        }
      } catch (error: any) {
        console.error('Failed to read user data:', error);
      }
      return { cards: [] };
    });

    ipcMain.handle('write-user-data', async (_event: any, data: any) => {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'idea-parking-lot.json');
      try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
      } catch (error: any) {
        console.error('Failed to write user data:', error);
        return { success: false, error: error.message };
      }
    });

    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}
