import { BrowserWindow } from 'electron'
import {
  CORE_START_LOG,
  IS_AUTO_LAUNCH_ENABLED,
  IS_CORE_RUNNING,
  IS_SYSTEM_PROXY_ENABLED,
  PROFILE_LIST_UPDATED,
} from '../../shared/event.js'
import { Profile } from '../../shared/type.js'

let resolveReady: (() => void) | null = null
export const isReady = new Promise<void>((resolve) => {
  resolveReady = resolve
})
export const mainViewReady = (): void => {
  if (resolveReady) {
    resolveReady()
  }
}

export const sendToMainWindow = async (channel: string, ...args: unknown[]): Promise<void> => {
  await isReady
  const mainWindow = BrowserWindow.getAllWindows()[0]
  if (mainWindow) {
    mainWindow.webContents.send(channel, ...args)
  }
}

export const sendCoreRunningStatus = (isRunning: boolean): void => {
  sendToMainWindow(IS_CORE_RUNNING, isRunning)
}

export const sendSystemProxyStatus = (isEnabled: boolean): void => {
  sendToMainWindow(IS_SYSTEM_PROXY_ENABLED, isEnabled)
}

export const sendCoreStartLog = (log: string): void => {
  sendToMainWindow(CORE_START_LOG, log)
}

export const sendAutoLaunchStatus = (isEnabled: boolean): void => {
  sendToMainWindow(IS_AUTO_LAUNCH_ENABLED, isEnabled)
}

export const sendProfileListUpdated = (list: Profile[]): void => {
  sendToMainWindow(PROFILE_LIST_UPDATED, list)
}
