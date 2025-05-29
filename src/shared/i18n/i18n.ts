import { language } from '../../main/settings/index.js'
import en, { MAIN_PROCESS_LANG_MESSAGE } from './en.js'
import ru from './ru.js'
import zh from './zh.js'

const messages = {
  'zh-CN': zh,
  'en-US': en,
  'ru-RU': ru,
}

export const t = (key: string): string => {
  const locale = language.value

  if (messages.hasOwnProperty(locale)) {
    return messages[locale as keyof typeof messages]?.[key as keyof MAIN_PROCESS_LANG_MESSAGE] || key
  }

  return messages['en-US']?.[key as keyof MAIN_PROCESS_LANG_MESSAGE] || key
}
