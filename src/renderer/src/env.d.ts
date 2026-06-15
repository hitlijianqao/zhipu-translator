/// <reference types="vite/client" />

interface TranslateRequest {
  text: string
  sourceLang?: string
  targetLang: string
}

interface TranslationResult {
  translatedText: string
  detectedLanguage?: string
  sourceLanguage: string
  targetLanguage: string
  error?: string
}

interface Settings {
  apiKey?: string
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
}

interface WindowApi {
  translateText: (request: TranslateRequest) => Promise<TranslationResult>
  getSettings: () => Promise<Settings>
  updateSettings: (partial: Partial<Settings>) => Promise<Settings>
  getApiKey: () => Promise<string>
  setApiKey: (key: string) => Promise<void>
  testApiConnection: (apiKey: string) => Promise<boolean>
  readClipboard: () => Promise<string>
  writeClipboard: (text: string) => Promise<void>
  hideWindow: () => Promise<void>
  toggleMiniMode: () => Promise<void>
  showSettings: () => Promise<void>
  closeSettings: () => Promise<void>
  updateShortcuts: (hotkey: string, miniHotkey: string) => Promise<{ success: boolean; error?: string }>
  onSourceText: (callback: (text: string) => void) => () => void
  onModeChange: (callback: (mode: 'full' | 'mini') => void) => () => void
}

interface Window {
  api: WindowApi
}
