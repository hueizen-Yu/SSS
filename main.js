const { app, BrowserWindow } = require('electron');
const path = require('path');
const server = require('./server'); // This will start the Express server

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true
    },
    autoHideMenuBar: true,
    title: "健康資料紀錄"
  });

  // Load the local server URL
  // We add a slight delay to ensure the Express server is fully up
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 1000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});
