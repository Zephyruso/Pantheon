import { dialog } from 'electron'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'
import sudo from 'sudo-prompt'
import { IS_LINUX, IS_WINDOWS } from '../constant/index.js'
import {
  getCoreBinaryPath,
  getCoreSourcePath,
  getDataDir,
  getRunnerBinaryPath,
  getRunnerSourcePath,
} from '../utils/dir.js'

const sudoExec = (cmd: string, options?: { name: string }): Promise<string> => {
  return new Promise((resolve, reject) => {
    sudo.exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        dialog.showErrorBox('Error', String(stderr))
        console.error(stderr)
        reject(error)
        return
      }
      resolve(String(stdout))
    })
  })
}

export const installBinary = async (): Promise<string> => {
  if (IS_LINUX) {
    return installForLinux()
  } else if (IS_WINDOWS) {
    installForWindows()
    return Promise.resolve('')
  }
  return Promise.resolve('')
}

const installForLinux = (): Promise<string> => {
  const coreSourcePath = getCoreSourcePath()
  const coreDestPath = getCoreBinaryPath()

  if (process.env.APPIMAGE) {
    const dataDir = getDataDir()
    const tmpCorePath = join(dataDir, 'pantheon-core')
    const installCmd = `cp ${tmpCorePath} ${coreDestPath} && \
        chown root:root ${coreDestPath} && \
        chmod +sx ${coreDestPath}`

    copyFileSync(coreSourcePath, tmpCorePath)

    return sudoExec(installCmd, { name: 'Pantheon Installer' })
  }
  const installCmd = `cp ${coreSourcePath} ${coreDestPath} && \
      chown root:root ${coreDestPath} && \
      chmod +sx ${coreDestPath}`
  return sudoExec(installCmd, { name: 'Pantheon Installer' })
}

const installForWindows = (): void => {
  const coreSourcePath = getCoreSourcePath()
  const coreDestPath = getCoreBinaryPath()
  const runnerSourcePath = getRunnerSourcePath()
  const runnerDestPath = getRunnerBinaryPath()

  copyFileSync(coreSourcePath, coreDestPath)
  copyFileSync(runnerSourcePath, runnerDestPath)
}

export const uninstallBinary = async (): Promise<string> => {
  const coreDestPath = getCoreBinaryPath()

  if (IS_LINUX) {
    return await sudoExec(`rm ${coreDestPath}`, { name: 'Pantheon Uninstaller' })
  } else if (IS_WINDOWS) {
    const runnerDestPath = getRunnerBinaryPath()
    const uninstallCmd = `rm ${coreDestPath} ${runnerDestPath}`
    return await sudoExec(uninstallCmd, { name: 'Pantheon Uninstaller' })
  }
  return Promise.resolve('')
}

export const isBinaryInstalled = (): boolean => {
  const coreDestPath = getCoreBinaryPath()

  if (IS_WINDOWS && !existsSync(coreDestPath)) {
    installForWindows()
  }

  return existsSync(coreDestPath)
}
