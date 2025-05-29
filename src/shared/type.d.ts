import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      send: (channel: string, data: unknown) => void
      invoke: <T>(channel: string, ...args: unknown[]) => Promise<T>
      on: (channel: string, func: (...args: unknown[]) => void) => void
    }
  }
}

type LocalProfile = {
  uuid: string
  isActive: boolean
  name: string
  type: 'local'
}

type RemoteProfile = {
  uuid: string
  isActive: boolean
  name: string
  type: 'remote'
  autoUpdate: boolean
  updatedAt: number
  interval: number
  url: string
}

type Profile = LocalProfile | RemoteProfile

interface Settings {
  language: string
  theme?: string
  profiles: Profile[]
}
