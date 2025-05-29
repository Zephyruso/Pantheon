import AutoLaunch from 'auto-launch'
import { ipcMain } from 'electron'
import { ref, watch } from 'vue'
import { DISABLE_AUTO_LAUNCH, ENABLE_AUTO_LAUNCH } from '../../shared/event.js'
import { startCore } from '../core/index.js'
import { getExePath } from '../utils/dir.js'
import { sendAutoLaunchStatus } from '../utils/send-msg.js'

let appLauncher: AutoLaunch
const isAutoLaunchEnabled = ref(false)

watch(isAutoLaunchEnabled, async (val) => {
  sendAutoLaunchStatus(val)
})

export const initAutoLaunch = async (): Promise<void> => {
  appLauncher = new AutoLaunch({
    name: 'Pantheon',
    path: getExePath(),
    isHidden: true,
  })

  isAutoLaunchEnabled.value = await appLauncher.isEnabled()

  if (isAutoLaunchEnabled.value) {
    try {
      await startCore()
    } catch (error) {
      console.error('Failed to auto-start core:', error)
    }
  }
}

export const enableAutoLaunch = async (): Promise<void> => {
  try {
    await appLauncher.enable()
  } finally {
    isAutoLaunchEnabled.value = await appLauncher.isEnabled()
  }
}

export const disableAutoLaunch = async (): Promise<void> => {
  try {
    await appLauncher.disable()
  } finally {
    isAutoLaunchEnabled.value = await appLauncher.isEnabled()
  }
}

export const initAutoLaunchListener = () => {
  ipcMain.handle(ENABLE_AUTO_LAUNCH, () => {
    return enableAutoLaunch()
  })
  ipcMain.handle(DISABLE_AUTO_LAUNCH, () => {
    return disableAutoLaunch()
  })
}
