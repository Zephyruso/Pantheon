import { ipcMain } from 'electron'
import {
  deleteProfile,
  getActiveProfileUuid,
  getClashAPIConfig,
  saveProfile,
  setActiveProfile,
  updateProfile,
  updateRemoteProfile,
} from '.'
import {
  DELETE_PROFILE,
  GET_ACTIVE_PROFILE,
  GET_CLASH_API_ENDPOINT,
  GET_PROFILE_CONTENT,
  GET_RUNTIME_PROFILE_CONTENT,
  SET_ACTIVE_PROFILE,
  SET_PROFILE,
  SET_PROFILE_CONTENT,
  UPDATE_PROFILE,
  UPDATE_REMOTE_PROFILE,
} from '../../shared/event'
import { Profile } from '../../shared/type'
import { readProfileContent, readRuntimeProfileContent, writeProfileContent } from './content'

export const initProfileListener = () => {
  ipcMain.handle(GET_CLASH_API_ENDPOINT, () => {
    return getClashAPIConfig()
  })

  ipcMain.handle(SET_PROFILE, (_, { profile, content }) => {
    return saveProfile(profile, content)
  })
  ipcMain.handle(DELETE_PROFILE, (_, profileUuid) => {
    return deleteProfile(profileUuid)
  })
  ipcMain.handle(UPDATE_PROFILE, (_, profile: Partial<Profile> & { uuid: string }) => {
    return updateProfile(profile.uuid, profile)
  })
  ipcMain.handle(UPDATE_REMOTE_PROFILE, (_, profileUuid) => {
    return updateRemoteProfile(profileUuid)
  })

  ipcMain.handle(GET_ACTIVE_PROFILE, () => {
    return getActiveProfileUuid()
  })
  ipcMain.handle(SET_ACTIVE_PROFILE, (_, profileUuid) => {
    return setActiveProfile(profileUuid)
  })
  ipcMain.handle(GET_RUNTIME_PROFILE_CONTENT, () => {
    return readRuntimeProfileContent()
  })
  ipcMain.handle(GET_PROFILE_CONTENT, (_, profileUuid) => {
    return readProfileContent(profileUuid)
  })
  ipcMain.handle(SET_PROFILE_CONTENT, (_, { profileUuid, profile }) => {
    writeProfileContent(profileUuid, profile)
  })
}
