import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { Ref, shallowRef, watch } from 'vue'
import { Profile, Settings } from '../../shared/type'
import { getSettingsPath } from '../utils/dir'

// 默认设置
const DEFAULT_SETTINGS: Settings = {
  language: app.getLocale(),
  theme: '',
  profiles: [] as Profile[],
}

const readSettings = (): Settings => {
  try {
    const settingsPath = getSettingsPath()

    if (!existsSync(settingsPath)) {
      // 如果文件不存在，创建默认设置文件
      writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
      return DEFAULT_SETTINGS
    }

    const fileContent = readFileSync(settingsPath, 'utf-8')
    const settings = JSON.parse(fileContent) as Settings

    // 合并默认设置，确保所有必需字段都存在
    return { ...DEFAULT_SETTINGS, ...settings }
  } catch (error) {
    console.error('读取设置文件失败:', error)
    return DEFAULT_SETTINGS
  }
}

const writeSettings = (settings: Partial<Settings>): void => {
  try {
    const currentSettings = readSettings()
    const newSettings = { ...currentSettings, ...settings }

    const settingsPath = getSettingsPath()
    writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), 'utf-8')
  } catch (error) {
    console.error('写入设置文件失败:', error)
  }
}

const getSetting = <K extends keyof Settings>(key: K): Settings[K] => {
  const settings = readSettings()
  return settings[key]
}

const refMap = new Map<keyof Settings, Ref<Settings[keyof Settings]>>()
const useSetting = <K extends keyof Settings>(key: K, defaultValue: Settings[K]) => {
  const setting = shallowRef<Settings[K]>(getSetting(key) || defaultValue)

  refMap.set(key, setting)
  watch(
    setting,
    (value) => {
      const currentSettings = readSettings()

      currentSettings[key] = value
      writeSettings(currentSettings)
    },
    { immediate: true },
  )

  return setting
}

export const language = useSetting('language', DEFAULT_SETTINGS.language)
export const theme = useSetting('theme', DEFAULT_SETTINGS.theme)
export const profiles = useSetting('profiles', DEFAULT_SETTINGS.profiles)

// 更新单个设置项
export const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]): void => {
  const ref = refMap.get(key)
  if (ref) {
    ref.value = value
  }
}
