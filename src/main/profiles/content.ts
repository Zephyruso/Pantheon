import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getProfileDir, getRuntimeDir } from '../utils/dir.js'

export const readRuntimeProfileContent = (): string => {
  return readFileSync(join(getRuntimeDir(), 'config.json'), 'utf-8')
}

export const readProfileContent = (profileUuid: string): string => {
  const path = join(getProfileDir(), profileUuid)

  if (!existsSync(path)) {
    return ''
  }

  return readFileSync(join(getProfileDir(), profileUuid), 'utf-8')
}

export const writeProfileContent = (profileUuid: string, content: string): void => {
  return writeFileSync(join(getProfileDir(), profileUuid), content)
}

export const deleteProfileContent = (profileUuid: string): void => {
  return unlinkSync(join(getProfileDir(), profileUuid))
}
