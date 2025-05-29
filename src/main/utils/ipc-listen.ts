import { ipcMain } from 'electron'
import {
  CLEAR_RUNTIME_DIR,
  INSTALL_BINARY,
  IS_BINARY_INSTALLED,
  START_CORE,
  STOP_CORE,
  UNINSTALL_BINARY,
} from '../../shared/event.js'
import { startCore, stopCore } from '../core/index.js'
import { initProfileListener } from '../profiles/listener.js'
import { syncSettingsListener } from '../settings/sync.js'
import { initAutoLaunchListener } from '../system/auto-launch.js'
import { installBinary, isBinaryInstalled, uninstallBinary } from '../system/install.js'
import { initSystemProxyListener } from '../system/system-proxy.js'
import { clearRuntimeDir } from './dir.js'

export function registerIPCListener(): void {
  // core
  ipcMain.handle(START_CORE, () => {
    return startCore()
  })
  ipcMain.handle(STOP_CORE, () => {
    return stopCore()
  })

  // 二进制安装相关
  ipcMain.handle(IS_BINARY_INSTALLED, () => {
    return isBinaryInstalled()
  })
  ipcMain.handle(INSTALL_BINARY, () => {
    return installBinary()
  })
  ipcMain.handle(UNINSTALL_BINARY, () => {
    return uninstallBinary()
  })

  // 清空runtime目录
  ipcMain.handle(CLEAR_RUNTIME_DIR, () => {
    return clearRuntimeDir()
  })

  initAutoLaunchListener()
  initProfileListener()
  initSystemProxyListener()
  syncSettingsListener()
}
