import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import icon from '../../build/icon.png?asset'
import { IS_WINDOWS } from './constant'
import { forceCleanup, stopCore } from './core/index.js'
import { clearAllAutoUpdates, setupAutoUpdate } from './profiles/auto-update.js'
import { initAutoLaunch } from './system/auto-launch.js'
import { initLocale } from './system/locale.js'
import { unsetSystemProxyHandler } from './system/system-proxy'
import { createTray, destroyTray } from './system/tray.js'
import { restartIfNotAdmin } from './system/win32'
import { initDir } from './utils/dir.js'
import { registerIPCListener } from './utils/ipc-listen.js'
import { mainViewReady } from './utils/send-msg.js'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      partition: 'persist:main',
    },
  })

  mainWindow.on('ready-to-show', () => {
    initAutoLaunch()
    createTray(mainWindow)
    mainWindow.show()
    mainViewReady()
  })

  mainWindow.on('close', async (event) => {
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.Pantheon')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initLocale()
  if (IS_WINDOWS) {
    restartIfNotAdmin()
  }
  initDir()
  registerIPCListener()
  createWindow()
  setupAutoUpdate()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

// 添加一个标志来防止重复执行
let isQuitting = false

app.on('before-quit', async () => {
  // 防止重复执行
  if (isQuitting) {
    return
  }
  isQuitting = true

  // 停止核心进程
  stopCore()
  // 清理系统代理
  await unsetSystemProxyHandler()
  // 销毁托盘
  destroyTray()
  clearAllAutoUpdates()
})

app.on('quit', () => {
  // 确保进程被完全清理
  forceCleanup()
  process.exit(0)
})
