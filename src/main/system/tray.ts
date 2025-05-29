import { app, BrowserWindow, Menu, Tray } from 'electron'
import { join } from 'path'
import { watch } from 'vue'
import { t } from '../../shared/i18n/i18n.js'
import { isCoreRunning, startCore, stopCore } from '../core/index.js'
import { setActiveProfile } from '../profiles/index.js'
import { language, profiles } from '../settings/index.js'
import { getResourcesDir } from '../utils/dir.js'
import {
  isSystemProxyActive,
  setSystemProxyHandler,
  unsetSystemProxyHandler,
} from './system-proxy.js'

let trayInstance: Tray | null = null

// 处理配置文件切换和启动的函数
const switchProfileAndStart = (profileUuid: string) => {
  // 如果核心正在运行，先停止
  if (isCoreRunning.value) {
    stopCore()
  }

  // 设置新的活动配置文件
  setActiveProfile(profileUuid)

  // 启动核心
  startCore()
}

export const createTray = async (mainWindow: BrowserWindow): Promise<void> => {
  if (trayInstance) {
    return
  }
  const iconPath = join(getResourcesDir(), 'icon.png')
  trayInstance = new Tray(iconPath)

  const updateContextMenu = () => {
    const profileList = profiles.value
    const activeProfileUuid = profileList.find((p) => p.isActive)?.uuid || ''

    // 创建配置文件子菜单
    const profileSubmenu = profileList.map((profile) => ({
      label: profile.name,
      type: 'radio' as const,
      checked: profile.uuid === activeProfileUuid,
      click: () => switchProfileAndStart(profile.uuid),
    }))

    const contextMenu = Menu.buildFromTemplate([
      {
        label: isCoreRunning.value ? t('coreIsRunning') : t('coreIsNotRunning'),
        enabled: false,
      },
      {
        label: t('startCore'),
        click: startCore,
        visible: !isCoreRunning.value,
      },
      {
        label: t('stopCore'),
        click: stopCore,
        visible: isCoreRunning.value,
      },
      { type: 'separator' },
      {
        label: t('switchProfile'),
        submenu:
          profileSubmenu.length > 0
            ? profileSubmenu
            : [
                {
                  label: t('noProfileFound'),
                  enabled: false,
                },
              ],
      },
      { type: 'separator' },
      {
        label: isSystemProxyActive.value ? t('systemProxyIsRunning') : t('systemProxyIsNotRunning'),
        enabled: false,
      },
      {
        label: t('startSystemProxy'),
        click: setSystemProxyHandler,
        visible: !isSystemProxyActive.value,
      },
      {
        label: t('stopSystemProxy'),
        click: unsetSystemProxyHandler,
        visible: isSystemProxyActive.value,
      },
      { type: 'separator' },
      {
        label: t('showMainWindow'),
        click: () => {
          mainWindow.show()
        },
      },
      {
        label: t('quit'),
        click: () => {
          if (!mainWindow.isDestroyed()) {
            mainWindow.destroy()
          }
          app.quit()
        },
      },
    ])

    trayInstance!.setContextMenu(contextMenu)
  }

  trayInstance!.setToolTip('Pantheon')
  trayInstance!.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })

  updateContextMenu()
  watch([isCoreRunning, isSystemProxyActive, language, profiles], () => {
    updateContextMenu()
  })
}

export const destroyTray = (): void => {
  if (trayInstance) {
    trayInstance.destroy()
    trayInstance = null
  }
}
