import { ipcMain } from 'electron'
import { updateSetting } from '.'
import { UPDATE_SETTINGS } from '../../shared/event'
import { Settings } from '../../shared/type'

export const syncSettingsListener = () => {
  ipcMain.handle(UPDATE_SETTINGS, (_, { key, value }: { key: string; value: string }) => {
    updateSetting(key as keyof Settings, value)
  })
}
