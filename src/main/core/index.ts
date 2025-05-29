import { ChildProcess, spawn } from 'child_process'
import { ref, watch } from 'vue'
import { CORE_START_SUCCESS_FLAG } from '../constant/index.js'
import { prepareActiveProfile } from '../profiles/index.js'
import { getCoreBinaryPath, getRuntimeDir } from '../utils/dir.js'
import { sendCoreRunningStatus, sendCoreStartLog } from '../utils/send-msg.js'

export let coreProcess: ChildProcess
export const isCoreRunning = ref(false)

watch(
  isCoreRunning,
  (val) => {
    sendCoreRunningStatus(val)
  },
  { immediate: true },
)

const outputHandler = (data: string) => {
  const log = data.toString()
  if (!isCoreRunning.value) {
    sendCoreStartLog(log)
  }
  if (log.includes(CORE_START_SUCCESS_FLAG)) {
    isCoreRunning.value = true
  }
}

export const startCore = (): void => {
  stopCore()
  if (!prepareActiveProfile()) {
    return
  }

  coreProcess = spawn(getCoreBinaryPath(), ['run', '-D', getRuntimeDir()])

  coreProcess.stdout?.on('data', outputHandler)
  coreProcess.stderr?.on('data', outputHandler)

  coreProcess.on('exit', () => {
    isCoreRunning.value = false
  })

  // 确保在进程意外退出时也能清理状态
  coreProcess.on('error', (error) => {
    console.error('Core process error:', error)
    isCoreRunning.value = false
  })
}

export const stopCore = (): void => {
  isCoreRunning.value = false
  coreProcess?.kill('SIGINT')
}

// 强制清理所有子进程
export const forceCleanup = (): void => {
  isCoreRunning.value = false
  if (coreProcess && !coreProcess.killed) {
    try {
      coreProcess.kill('SIGKILL')
    } catch (error) {
      console.error('Failed to force kill core process:', error)
    }
  }
}
