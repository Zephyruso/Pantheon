import { execSync } from 'child_process'
import fs, { createWriteStream } from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保 resources 目录存在
const resourcesDir = path.join(__dirname, '../resources')
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true })
}

// 根据平台设置目标文件名和下载URL
const platform = process.platform
const arch = process.arch === 'x64' ? 'amd64' : process.arch
const coreName = platform === 'win32' ? 'pantheon-core.exe' : 'pantheon-core'

// 下载 sing-box
async function downloadSingBox() {
  const version = '1.11.13' // sing-box 版本
  let downloadUrl
  let fileName

  if (platform === 'win32') {
    fileName = `sing-box-${version}-windows-${arch}.zip`
    downloadUrl = `https://github.com/sagernet/sing-box/releases/download/v${version}/${fileName}`
  } else if (platform === 'darwin') {
    fileName = `sing-box-${version}-darwin-${arch}.tar.gz`
    downloadUrl = `https://github.com/sagernet/sing-box/releases/download/v${version}/${fileName}`
  } else {
    fileName = `sing-box-${version}-linux-${arch}.tar.gz`
    downloadUrl = `https://github.com/sagernet/sing-box/releases/download/v${version}/${fileName}`
  }

  const zipPath = path.join(resourcesDir, fileName)
  const tempDir = path.join(resourcesDir, 'temp')

  try {
    console.log('开始下载 sing-box...')
    const response = await fetch(downloadUrl)
    if (!response.ok) throw new Error(`下载失败: ${response.statusText} ${downloadUrl}`)

    const fileStream = createWriteStream(zipPath)
    await pipeline(response.body, fileStream)

    // 解压文件
    console.log('解压 sing-box...')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    if (platform === 'win32') {
      execSync(`unzip -o "${zipPath}" -d "${tempDir}"`)
    } else {
      execSync(`tar -xzf "${zipPath}" -C "${tempDir}"`)
    }

    // 移动并重命名文件
    const binaryName = platform === 'win32' ? 'sing-box.exe' : 'sing-box'
    const extractedDir =
      platform === 'win32'
        ? path.join(tempDir, fileName.replace('.zip', ''))
        : path.join(tempDir, fileName.replace('.tar.gz', ''))
    fs.renameSync(path.join(extractedDir, binaryName), path.join(resourcesDir, coreName))

    // 清理临时文件
    fs.rmSync(tempDir, { recursive: true, force: true })
    fs.unlinkSync(zipPath)

    console.log('sing-box 下载并解压完成！')
  } catch (error) {
    console.error('下载或解压 sing-box 时出错:', error)
    process.exit(1)
  }
}

async function buildRunner() {
  try {
    console.log('开始编译 runner...')
    const targetName = 'pantheon-runner.exe'
    execSync(`go build -o ${path.join(resourcesDir, targetName)} .`, {
      cwd: path.join(__dirname, '../runner'),
      stdio: 'inherit',
    })
    console.log('runner 编译完成！')
  } catch (error) {
    console.error('编译 runner 时出错:', error)
    process.exit(1)
  }
}

// 执行所有任务
async function main() {
  await downloadSingBox()
  if (platform === 'win32') {
    await buildRunner()
  }
}

main().catch(console.error)
