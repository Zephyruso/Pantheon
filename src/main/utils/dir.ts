import { is } from '@electron-toolkit/utils'
import { app } from 'electron'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { IS_LINUX, IS_WINDOWS } from '../constant'

export const getResourcesDir = (): string => {
  if (is.dev) {
    return join(__dirname, '..', '..', 'resources')
  } else if ((IS_LINUX && process.env.APPIMAGE) || app.getAppPath().endsWith('asar')) {
    return process.resourcesPath
  } else {
    return join(app.getAppPath(), 'resources')
  }
}

export const getCoreSourcePath = (): string => {
  if (IS_WINDOWS) {
    return join(getResourcesDir(), 'pantheon-core.exe')
  }
  return join(getResourcesDir(), 'pantheon-core')
}

export function getExePath(): string {
  if (IS_LINUX) {
    if (process.env.APPIMAGE) {
      return process.env.APPIMAGE
    }
    return join(app.getPath('exe'), '..', 'resources', 'app.asar')
  }
  return app.getPath('exe')
}

// Windows only
export const getRunnerSourcePath = (): string => {
  return join(getResourcesDir(), 'pantheon-runner.exe')
}

export const getBinaryDir = () => {
  if (IS_WINDOWS) {
    return join(process.env.APPDATA || '', 'Pantheon')
  }
  return join('/usr', 'local', 'bin')
}

export const getCoreBinaryPath = (): string => {
  if (IS_WINDOWS) {
    return join(getBinaryDir(), 'pantheon-core.exe')
  }
  return join(getBinaryDir(), 'pantheon-core')
}

// Windows only
export const getRunnerBinaryPath = (): string => {
  return join(getBinaryDir(), 'pantheon-runner.exe')
}

export const getDataDir = (): string => {
  return app.getPath('userData')
}

export const getTaskDir = (): string => {
  const taskDir = join(getDataDir(), 'task')
  initDirIfNotExist(taskDir)
  return taskDir
}

export const getRuntimeDir = (): string => {
  return join(getDataDir(), 'runtime')
}

export const getProfileDir = (): string => {
  return join(getDataDir(), 'profile')
}

export const getSettingsPath = (): string => {
  return join(getDataDir(), 'settings.json')
}

const initDirIfNotExist = (dir: string): void => {
  if (!existsSync(dir)) {
    mkdirSync(dir)
  }
}

export const initDir = (): void => {
  initDirIfNotExist(getRuntimeDir())
  initDirIfNotExist(getProfileDir())
}

export const clearRuntimeDir = (): void => {
  const runtimeDir = getRuntimeDir()
  if (existsSync(runtimeDir)) {
    rmSync(runtimeDir, { recursive: true, force: true })
  }
  // 重新创建空的runtime目录
  initDirIfNotExist(runtimeDir)
}
