import { dialog, ipcMain } from 'electron'
import { ref, watch } from 'vue'
import { SET_SYSTEM_PROXY, UNSET_SYSTEM_PROXY } from '../../shared/event'
import { t } from '../../shared/i18n/i18n.js'
import { readRuntimeProfileContent } from '../profiles/content'
import { setSystemProxy, unsetSystemProxy } from '../utils/proxy-manager'
import { sendSystemProxyStatus } from '../utils/send-msg'

export const isSystemProxyActive = ref(false)

watch(isSystemProxyActive, (val) => {
  sendSystemProxyStatus(val)
})

export const setSystemProxyHandler = async (): Promise<void> => {
  const runtimeConfig = JSON.parse(readRuntimeProfileContent())
  const inbounds = runtimeConfig.inbounds
  const proxy = inbounds.find((inbound) => ['http', 'mixed'].includes(inbound.type))

  if (!proxy) {
    isSystemProxyActive.value = false
    dialog.showErrorBox('Error', t('noProxyFound'))
    return
  }

  const address = `http://${proxy.listen}:${proxy.listen_port}`

  const result = await setSystemProxy(address)

  if (result.status === 'success') {
    isSystemProxyActive.value = true
  } else {
    console.error('Failed to set system proxy:', result.message)
    isSystemProxyActive.value = false
  }
}

export const unsetSystemProxyHandler = async (): Promise<void> => {
  const result = await unsetSystemProxy()

  if (result.status === 'success') {
    isSystemProxyActive.value = false
  } else {
    console.error('Failed to unset system proxy:', result.message)
  }
}

export const initSystemProxyListener = () => {
  ipcMain.handle(SET_SYSTEM_PROXY, () => {
    return setSystemProxyHandler()
  })
  ipcMain.handle(UNSET_SYSTEM_PROXY, () => {
    return unsetSystemProxyHandler()
  })
}
