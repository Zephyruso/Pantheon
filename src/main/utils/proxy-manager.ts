import { spawn } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { IS_WINDOWS } from '../constant'

interface ProxyConfig {
  host: string
  port: string
}

interface ProxyResult {
  status: string
  message: string
}

export async function setSystemProxy(proxy: string): Promise<ProxyResult> {
  if (!proxy) {
    return { status: 'error', message: 'Proxy address cannot be empty' }
  }

  try {
    // 设置环境变量
    process.env.HTTP_PROXY = proxy
    process.env.HTTPS_PROXY = proxy
    process.env.NO_PROXY = 'localhost,127.0.0.1,::1'

    if (IS_WINDOWS) {
      await setWindowsProxy(proxy)
    } else {
      await setLinuxProxy(proxy)
    }

    console.log(`System proxy set to: ${proxy}`)
    return { status: 'success', message: `System proxy set to: ${proxy}` }
  } catch (error) {
    console.error('Failed to set system proxy:', error)
    return { status: 'error', message: `Failed to set system proxy: ${error}` }
  }
}

export async function unsetSystemProxy(): Promise<ProxyResult> {
  try {
    // 清除环境变量
    delete process.env.HTTP_PROXY
    delete process.env.HTTPS_PROXY
    delete process.env.NO_PROXY

    if (IS_WINDOWS) {
      await unsetWindowsProxy()
    } else {
      await unsetLinuxProxy()
    }

    console.log('System proxy unset')
    return { status: 'success', message: 'System proxy unset' }
  } catch (error) {
    console.error('Failed to unset system proxy:', error)
    return { status: 'error', message: `Failed to unset system proxy: ${error}` }
  }
}

export async function isProxyEnabled(): Promise<ProxyResult> {
  const proxy = process.env.HTTP_PROXY
  if (!proxy) {
    return { status: 'error', message: 'Proxy is not enabled' }
  }
  return { status: 'success', message: 'Proxy is enabled' }
}

async function setWindowsProxy(proxy: string): Promise<void> {
  const { host, port } = parseProxyAddress(proxy)

  // 使用netsh设置WinHTTP代理
  await execCommand('netsh', ['winhttp', 'set', 'proxy', `${host}:${port}`])

  // 设置Windows注册表代理
  await setWindowsRegistryProxy(host, port, true)
}

async function unsetWindowsProxy(): Promise<void> {
  // 重置WinHTTP代理
  await execCommand('netsh', ['winhttp', 'reset', 'proxy'])

  // 清除Windows注册表代理
  await setWindowsRegistryProxy('', '', false)
}

async function setWindowsRegistryProxy(host: string, port: string, enable: boolean): Promise<void> {
  let script: string

  if (enable) {
    script = `
      $path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"
      Set-ItemProperty -Path $path -Name ProxyEnable -Value 1
      Set-ItemProperty -Path $path -Name ProxyServer -Value "${host}:${port}"
    `
  } else {
    script = `
      $path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"
      Set-ItemProperty -Path $path -Name ProxyEnable -Value 0
      Remove-ItemProperty -Path $path -Name ProxyServer -ErrorAction SilentlyContinue
    `
  }

  await execCommand('powershell', ['-Command', script])
}

async function setLinuxProxy(proxy: string): Promise<void> {
  const desktop = process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION || ''
  const desktopLower = desktop.toLowerCase()

  if (desktopLower.includes('gnome') || desktopLower.includes('unity')) {
    await setGnomeProxy(proxy)
  } else if (desktopLower.includes('kde')) {
    await setKdeProxy(proxy)
  } else {
    await setGenericLinuxProxy(proxy)
  }
}

async function unsetLinuxProxy(): Promise<void> {
  const desktop = process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION || ''
  const desktopLower = desktop.toLowerCase()

  if (desktopLower.includes('gnome') || desktopLower.includes('unity')) {
    await unsetGnomeProxy()
  } else if (desktopLower.includes('kde')) {
    await unsetKdeProxy()
  } else {
    await unsetGenericLinuxProxy()
  }
}

async function setGnomeProxy(proxy: string): Promise<void> {
  const { host, port } = parseProxyAddress(proxy)

  await execCommand('gsettings', ['set', 'org.gnome.system.proxy.http', 'host', host])
  await execCommand('gsettings', ['set', 'org.gnome.system.proxy.http', 'port', port])
  await execCommand('gsettings', ['set', 'org.gnome.system.proxy.https', 'host', host])
  await execCommand('gsettings', ['set', 'org.gnome.system.proxy.https', 'port', port])
  await execCommand('gsettings', ['set', 'org.gnome.system.proxy', 'mode', 'manual'])
}

async function unsetGnomeProxy(): Promise<void> {
  await execCommand('gsettings', ['set', 'org.gnome.system.proxy', 'mode', 'none'])
}

async function setKdeProxy(proxy: string): Promise<void> {
  const { host, port } = parseProxyAddress(proxy)
  const configDir = process.env.XDG_CONFIG_HOME || join(homedir(), '.config')
  const kioslavercPath = join(configDir, 'kioslaverc')

  const config = `[Proxy Settings]
ProxyType=1
httpProxy=${host}:${port}
httpsProxy=${host}:${port}
ftpProxy=${host}:${port}
socksProxy=
NoProxyFor=localhost,127.0.0.1
`

  writeFileSync(kioslavercPath, config, { mode: 0o644 })

  // 发送DBus信号通知KDE设置更改
  try {
    await execCommand('dbus-send', [
      '--session',
      '--type=signal',
      '/KGlobalSettings',
      'org.kde.KGlobalSettings.notifyChange',
      'int32:5',
      'int32:0',
    ])
  } catch (error) {
    // DBus命令可能失败，但不影响主要功能
    console.warn('Failed to send DBus signal:', error)
  }
}

async function unsetKdeProxy(): Promise<void> {
  const configDir = process.env.XDG_CONFIG_HOME || join(homedir(), '.config')
  const kioslavercPath = join(configDir, 'kioslaverc')

  const config = `[Proxy Settings]
ProxyType=0
httpProxy=
httpsProxy=
ftpProxy=
socksProxy=
NoProxyFor=
`

  writeFileSync(kioslavercPath, config, { mode: 0o644 })

  // 发送DBus信号通知KDE设置更改
  try {
    await execCommand('dbus-send', [
      '--session',
      '--type=signal',
      '/KGlobalSettings',
      'org.kde.KGlobalSettings.notifyChange',
      'int32:5',
      'int32:0',
    ])
  } catch (error) {
    // DBus命令可能失败，但不影响主要功能
    console.warn('Failed to send DBus signal:', error)
  }
}

async function setGenericLinuxProxy(proxy: string): Promise<void> {
  const profileFiles = [
    join(homedir(), '.bashrc'),
    join(homedir(), '.zshrc'),
    join(homedir(), '.profile'),
  ]

  const proxyEnv = `
export HTTP_PROXY="${proxy}"
export HTTPS_PROXY="${proxy}"
export NO_PROXY="localhost,127.0.0.1,::1"
`

  for (const file of profileFiles) {
    if (existsSync(file)) {
      try {
        const content = readFileSync(file, 'utf8')
        if (!content.includes('HTTP_PROXY')) {
          writeFileSync(file, content + proxyEnv, { flag: 'a' })
        }
      } catch (error) {
        console.warn(`Failed to update ${file}:`, error)
      }
    }
  }
}

async function unsetGenericLinuxProxy(): Promise<void> {
  const profileFiles = [
    join(homedir(), '.bashrc'),
    join(homedir(), '.zshrc'),
    join(homedir(), '.profile'),
  ]

  for (const file of profileFiles) {
    if (existsSync(file)) {
      try {
        const content = readFileSync(file, 'utf8')
        const lines = content.split('\n')
        const newLines = lines.filter(
          (line) =>
            !line.includes('HTTP_PROXY') &&
            !line.includes('HTTPS_PROXY') &&
            !line.includes('NO_PROXY'),
        )
        const newContent = newLines.join('\n')
        writeFileSync(file, newContent)
      } catch (error) {
        console.warn(`Failed to clean ${file}:`, error)
      }
    }
  }
}

function parseProxyAddress(proxy: string): ProxyConfig {
  const cleanProxy = proxy
    .replace(/^http:\/\//, '')
    .replace(/^https:\/\//, '')
    .replace(/^socks5:\/\//, '')
    .replace(/^socks4:\/\//, '')

  const parts = cleanProxy.split(':')
  if (parts.length !== 2) {
    throw new Error(`Invalid proxy address format: ${proxy}`)
  }

  const [host, port] = parts
  if (!host || !port) {
    throw new Error('Proxy host or port is empty')
  }

  return { host, port }
}

function execCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'pipe' })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} command failed: ${stderr || stdout}`))
      }
    })

    child.on('error', (error) => {
      reject(new Error(`${command} command error: ${error.message}`))
    })
  })
}
