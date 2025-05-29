import dayjs from 'dayjs'
import { watch } from 'vue'
import { RemoteProfile } from '../../shared/type.js'
import { profiles } from '../settings/index.js'
import { updateRemoteProfile } from './index.js'

const updateTimers = new Map<string, NodeJS.Timeout>()

export const clearAllAutoUpdates = () => {
  updateTimers.forEach((timer) => clearTimeout(timer))
  updateTimers.clear()
}

export const setupAutoUpdate = () => {
  profiles.value.forEach((profile) => {
    if (profile.type === 'remote' && profile.autoUpdate) {
      const diff = dayjs().diff(dayjs(profile.updatedAt), 'second')

      if (diff >= profile.interval) {
        updateProfileWithTimer(profile)
      } else {
        const timer = setTimeout(
          () => updateProfileWithTimer(profile),
          (profile.interval - diff) * 1000,
        )
        updateTimers.set(profile.uuid, timer)
      }
    }
  })
}

const updateProfileWithTimer = async (profile: RemoteProfile) => {
  // 清理已存在的定时器
  const existingTimer = updateTimers.get(profile.uuid)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  try {
    await updateRemoteProfile(profile.uuid)
  } catch (error) {
    console.error(`Failed to update profile ${profile.uuid}:`, error)
  }

  // 设置新的定时器
  const timer = setTimeout(() => updateProfileWithTimer(profile), profile.interval * 1000)
  updateTimers.set(profile.uuid, timer)
}

watch(profiles, () => {
  clearAllAutoUpdates()
  setupAutoUpdate()
})
