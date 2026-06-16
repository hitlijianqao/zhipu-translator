import electron from 'electron'
const { app, safeStorage } = electron
import * as fs from 'fs'
import * as path from 'path'

export interface Settings {
  sourceLanguage: string
  targetLanguage: string
  hotKey: string
  miniModeHotKey: string
  autoCopy: boolean
  alwaysOnTop: boolean
  launchAtStartup: boolean
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  model: string
  customPrompt: string
  floatTranslate: boolean
}

export interface WindowState {
  x: number
  y: number
  width: number
  height: number
  isMini: boolean
}

interface Config {
  apiKeyEncrypted: string
  settings: Settings
  windowState: WindowState | null
}

const defaultSettings: Settings = {
  sourceLanguage: 'auto',
  targetLanguage: 'zh-CN',
  hotKey: 'Ctrl+Shift+T',
  miniModeHotKey: 'Ctrl+Shift+M',
  autoCopy: false,
  alwaysOnTop: true,
  launchAtStartup: false,
  theme: 'system',
  fontSize: 'medium',
  model: 'glm-4-flash',
  customPrompt: '',
  floatTranslate: false
}

const defaultConfig: Config = {
  apiKeyEncrypted: '',
  settings: { ...defaultSettings },
  windowState: null
}

function getConfigPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'config.json')
}

let config: Config = { ...defaultConfig }
let configLoaded = false

function loadConfig(): void {
  if (configLoaded) return
  try {
    const configPath = getConfigPath()
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      const loaded = JSON.parse(data)
      config = {
        apiKeyEncrypted: loaded.apiKeyEncrypted || '',
        settings: { ...defaultSettings, ...loaded.settings },
        windowState: loaded.windowState || null
      }
    }
  } catch (e) {
    console.error('Failed to load config:', e)
    config = { ...defaultConfig }
  }
  configLoaded = true
}

function saveConfig(): void {
  try {
    const configPath = getConfigPath()
    const dir = path.dirname(configPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save config:', e)
  }
}

export function initStore(): void {
  loadConfig()
}

export function getApiKey(): string {
  if (!config.apiKeyEncrypted) return ''
  if (safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(config.apiKeyEncrypted, 'base64'))
    } catch {
      return ''
    }
  }
  return config.apiKeyEncrypted
}

export function setApiKey(key: string): void {
  if (safeStorage.isEncryptionAvailable()) {
    config.apiKeyEncrypted = safeStorage.encryptString(key).toString('base64')
  } else {
    config.apiKeyEncrypted = key
  }
  saveConfig()
}

export function getSettings(): Settings {
  return { ...config.settings }
}

export function updateSettings(partial: Partial<Settings>): Settings {
  config.settings = { ...config.settings, ...partial }
  saveConfig()
  return { ...config.settings }
}

export function getWindowState(): WindowState | null {
  return config.windowState ? { ...config.windowState } : null
}

export function setWindowState(state: WindowState): void {
  config.windowState = { ...state }
  saveConfig()
}
