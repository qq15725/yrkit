import type { CAC } from 'cac'
import type { Options } from './types'
import { exec, spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cac } from 'cac'
import consola from 'consola'
import { bin, version } from '../package.json'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname)
const resolve = (...paths: string[]): string => path.join(root, ...paths)

function runBinCommand(bin: string, args: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(`./node_modules/.bin/${bin}`, args, {
      stdio: 'inherit',
      shell: true,
    })

    child.on('error', (err) => {
      console.error(`执行失败: ${err.message}`)
      reject(err)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      }
      else {
        reject(new Error(`进程退出，退出码: ${code}`))
      }
    })
  })
}

function getLocalIP(): string[] {
  const networkInterfaces = os.networkInterfaces()
  const localIPs: string[] = []

  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName]
    if (interfaces) {
      for (const iface of interfaces) {
        // 只获取 IPv4 且非内网回环地址的 IP
        if (iface.family === 'IPv4' && !iface.internal) {
          localIPs.push(iface.address)
        }
      }
    }
  }

  return localIPs
}

function getWifiName(): Promise<string> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line node/prefer-global/process
    const platform = process.platform

    // 根据操作系统选择合适的命令
    let command: string
    if (platform === 'win32') {
      command = 'netsh wlan show interfaces' // Windows
    }
    else if (platform === 'darwin') {
      command = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I' // macOS
    }
    else if (platform === 'linux') {
      command = 'nmcli -t -f active,ssid dev wifi | egrep \'^yes\' | cut -d\':\' -f2' // Linux
    }
    else {
      reject(new Error(`不支持的操作系统: ${platform}`))
      return
    }

    // 执行命令
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`命令执行失败: ${stderr || error.message}`))
        return
      }

      const output = stdout.trim()

      // 根据操作系统解析输出
      let wifiName = ''
      if (platform === 'win32') {
        const match = output.match(/SSID\s*:\s*(.+)/)
        wifiName = match ? match[1] : ''
      }
      else if (platform === 'darwin') {
        const match = output.match(/^\s*SSID:\s*(.+)/m)
        wifiName = match ? match[1] : ''
      }
      else if (platform === 'linux') {
        wifiName = output // nmcli 已返回正确结果
      }

      if (wifiName) {
        resolve(wifiName)
      }
      else {
        reject(new Error('未能解析 Wi-Fi 名称'))
      }
    })
  })
}

const args = [
  '-i',
  '-p 8001',
  '-w 8002',
]

async function showInfo(): Promise<void> {
  const ip = getLocalIP()[0]
  consola.info(`web地址`)
  consola.info(`http://${ip}:8002`)
  consola.log('')
  consola.info(`代理配置`)
  consola.info(`WIFI: ${await getWifiName()}`)
  consola.info(`服务器: ${ip}`)
  consola.info('端口: 8001')
  consola.log('')
}

export function createCli(_options: Options): CAC {
  const cli = cac(Object.keys(bin)[0])

  cli.command('start', '启动服务').action(async () => {
    await showInfo()
    await runBinCommand('anyproxy', args)
  })

  cli.command('xhs', '小红书工具').action(async () => {
    await showInfo()
    await runBinCommand('anyproxy', [
      ...args,
      `-r ${resolve('../rules/xhs.cjs')}`,
    ])
  })

  cli
    .help()
    .version(version)
    // eslint-disable-next-line node/prefer-global/process
    .parse(process.argv, { run: false })

  return cli
}
