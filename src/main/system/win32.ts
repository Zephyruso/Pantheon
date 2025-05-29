import { is } from '@electron-toolkit/utils'
import { execSync } from 'child_process'
import { app, dialog } from 'electron'
import { copyFileSync, existsSync, writeFileSync } from 'fs'
import path from 'path'
import { t } from '../../shared/i18n/i18n'
import { IS_WINDOWS } from '../constant'
import { getExePath, getRunnerBinaryPath, getRunnerSourcePath, getTaskDir } from '../utils/dir'

const createTaskXmlTemplate = (): string => {
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers />
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>Parallel</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>false</AllowHardTerminate>
    <StartWhenAvailable>false</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>3</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>"${getRunnerBinaryPath()}"</Command>
      <Arguments>"${getExePath()}"</Arguments>
    </Exec>
  </Actions>
</Task>`
}

const createElevatedTask = (): void => {
  const taskFilePath = path.join(getTaskDir(), 'pantheon-runner.xml')
  const taskXml = createTaskXmlTemplate()

  writeFileSync(taskFilePath, Buffer.from(`\ufeff${taskXml}`, 'utf-16le'))
  copyFileSync(getRunnerSourcePath(), getRunnerBinaryPath())
  execSync(
    `%SystemRoot%\\System32\\schtasks.exe /create /tn "pantheon-runner" /xml "${taskFilePath}" /f`,
  )
}

const saveStartupParameters = (): void => {
  const paramFilePath = path.join(getTaskDir(), 'param.txt')
  const args = process.argv.slice(1)

  if (args.length > 0) {
    writeFileSync(paramFilePath, args.join(' '))
  } else {
    writeFileSync(paramFilePath, 'empty')
  }
}

const runElevatedTask = (): void => {
  if (!existsSync(getRunnerBinaryPath())) {
    throw new Error('pantheon-runner.exe not found')
  }

  execSync('%SystemRoot%\\System32\\schtasks.exe /run /tn pantheon-runner')
}

export const restartIfNotAdmin = (): void => {
  if (!IS_WINDOWS || is.dev) {
    return
  }

  try {
    createElevatedTask()
  } catch (error) {
    console.error(error)
    try {
      saveStartupParameters()
      runElevatedTask()
    } catch (error) {
      console.error(error)
      dialog.showErrorBox('Error', t('adminPrivilegesRequired'))
    } finally {
      app.exit()
    }
  }
}
