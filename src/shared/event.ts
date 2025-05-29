// 核心相关事件
export const START_CORE = 'startCore'
export const STOP_CORE = 'stopCore'
export const IS_CORE_RUNNING = 'isCoreRunning'
export const CORE_START_LOG = 'coreStartLog'

// 自动启动相关事件
export const ENABLE_AUTO_LAUNCH = 'enableAutoLaunch'
export const DISABLE_AUTO_LAUNCH = 'disableAutoLaunch'
export const IS_AUTO_LAUNCH_ENABLED = 'isAutoLaunchEnabled'

// 获取 Clash API 配置
export const GET_CLASH_API_ENDPOINT = 'getClashAPIConfig'

// 获取/设置/删除 配置文件
export const PROFILE_LIST_UPDATED = 'profileListUpdated'
export const SET_PROFILE = 'saveProfile'
export const DELETE_PROFILE = 'deleteProfile'
export const UPDATE_PROFILE = 'updateProfile'
export const UPDATE_REMOTE_PROFILE = 'updateRemoteProfile'

// 获取/设置 活动配置
export const GET_ACTIVE_PROFILE = 'getActiveProfileUuid'
export const SET_ACTIVE_PROFILE = 'setActiveProfile'

// 获取/设置/删除 配置文件内容
export const GET_PROFILE_CONTENT = 'getProfileContent'
export const SET_PROFILE_CONTENT = 'writeProfileContent'
export const DELETE_PROFILE_CONTENT = 'deleteProfileContent'
export const GET_RUNTIME_PROFILE_CONTENT = 'getRuntimeProfileContent'

// 系统代理相关事件
export const SET_SYSTEM_PROXY = 'setSystemProxy'
export const UNSET_SYSTEM_PROXY = 'unsetSystemProxy'
export const IS_SYSTEM_PROXY_ENABLED = 'isSystemProxyEnabled'

// 二进制安装相关事件
export const IS_BINARY_INSTALLED = 'isBinaryInstalled'
export const INSTALL_BINARY = 'installBinary'
export const UNINSTALL_BINARY = 'uninstallBinary'

// 设置相关事件
export const UPDATE_SETTINGS = 'updateSettings'

// 清空runtime目录
export const CLEAR_RUNTIME_DIR = 'clearRuntimeDir'
