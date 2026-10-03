// Desktop wrapper: loads the static build (dist/) in a native window.
const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('node:path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#07060b',
    title: 'Null Void Saga · Eltária',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  Menu.setApplicationMenu(null)
  if (process.env.NV_DEV_URL) win.loadURL(process.env.NV_DEV_URL)
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.type === 'keyDown' && (input.key === 'F11' || (input.alt && input.key === 'Enter'))) win.setFullScreen(!win.isFullScreen())
  })
}

ipcMain.on('nv:quit', () => app.quit())
app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
