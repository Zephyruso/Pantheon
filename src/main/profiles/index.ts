import { dialog } from 'electron'
import { writeFileSync } from 'fs'
import { set } from 'lodash-es'
import { join } from 'path'
import { v4 as uuid } from 'uuid'
import { watch } from 'vue'
import { t } from '../../shared/i18n/i18n.js'
import { Profile } from '../../shared/type.js'
import { profiles } from '../settings/index.js'
import { getRuntimeDir } from '../utils/dir.js'
import { sendProfileListUpdated } from '../utils/send-msg.js'
import {
  deleteProfileContent,
  readProfileContent,
  readRuntimeProfileContent,
  writeProfileContent,
} from './content.js'

watch(
  profiles,
  (list) => {
    sendProfileListUpdated(list)
  },
  {
    deep: true,
    immediate: true,
  },
)

export const saveProfile = async (profile: Profile, content?: string): Promise<void> => {
  if (!profile.uuid) {
    profile.uuid = uuid()
  }

  if (!profiles.value.find((c) => c.uuid === profile.uuid)) {
    profiles.value = [...profiles.value, profile]
  } else {
    profiles.value = profiles.value.map((c) => (c.uuid === profile.uuid ? profile : c))
  }

  if (profile.type === 'local') {
    writeProfileContent(profile.uuid, content!)
  } else {
    updateRemoteProfile(profile.uuid)
  }
}

export const updateRemoteProfile = async (profileUuid: string): Promise<void> => {
  const profileValue = [...profiles.value]
  const profile = profileValue.find((c) => c.uuid === profileUuid)

  if (!profile || profile.type !== 'remote') {
    return
  }
  const data = await fetch(profile.url)
  const result = await data.text()

  profile.updatedAt = Date.now().valueOf()
  profiles.value = profileValue
  writeProfileContent(profile.uuid, result)
}

export const deleteProfile = (profileUuid: string): void => {
  profiles.value = profiles.value.filter((profile) => profile.uuid !== profileUuid)

  deleteProfileContent(profileUuid)
}

export const getActiveProfileUuid = (): string => {
  return profiles.value.find((c) => c.isActive)?.uuid || ''
}

export const setActiveProfile = (profileUuid: string): void => {
  profiles.value = profiles.value.map((profile) => ({
    ...profile,
    isActive: profile.uuid === profileUuid,
  }))
}

export const prepareActiveProfile = (): boolean => {
  if (!getActiveProfileUuid()) {
    if (profiles.value.length > 0) {
      setActiveProfile(profiles.value[0].uuid)
    } else {
      dialog.showErrorBox('Error', t('noProfileFound'))
      return false
    }
  }

  const profileUuid = getActiveProfileUuid()
  const profileContent = JSON.parse(readProfileContent(profileUuid))

  set(profileContent, 'log.level', 'info')
  set(profileContent, 'log.disabled', false)
  set(profileContent, 'experimental.clash_api', {
    access_control_allow_private_network: true,
    external_controller: '127.0.0.1:9999',
    external_ui: './zashboard',
    external_ui_download_url:
      'https://github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip',
    secret: uuid(),
  })

  writeFileSync(join(getRuntimeDir(), 'config.json'), JSON.stringify(profileContent))
  return true
}

export const getClashAPIConfig = (): {
  access_control_allow_private_network: boolean
  external_controller: string
  external_ui: string
  external_ui_download_url: string
  secret: string
} => {
  const profileContent = readRuntimeProfileContent()

  return JSON.parse(profileContent).experimental.clash_api
}

export const updateProfile = (profileUuid: string, profile: Partial<Profile>): void => {
  profiles.value = profiles.value.map((c) =>
    c.uuid === profileUuid ? ({ ...c, ...profile } as Profile) : c,
  )
}
