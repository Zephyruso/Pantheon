import { app } from 'electron'
import { language } from '../settings'

export const initLocale = () => {
  const locale = app.getLocale()

  if (locale.startsWith('zh')) {
    language.value = 'zh-CN'
  } else if (locale.startsWith('ru')) {
    language.value = 'ru-RU'
  } else {
    language.value = 'en-US'
  }
}