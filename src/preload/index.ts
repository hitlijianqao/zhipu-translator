import electron from 'electron'
const { contextBridge, ipcRenderer } = electron

// Types exposed to renderer
export interface TranslateRequest {
  text: string
  sourceLang?: string
  targetLang: string
}

export interface TranslationResult {
  translatedText: string
  detectedLanguage?: string
  sourceLanguage: string
  targetLanguage: string
  error?: string
}

export interface Settings {
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
}

// Expose a safe, limited API to the renderer process
contextBridge.exposeInMainWorld('api', {
  // Translation
  translateText: (request: TranslateRequest): Promise<TranslationResult> =>
    ipcRenderer.invoke('translate-text', request),

  // Settings
  getSettings: (): Promise<Settings> =>
    ipcRenderer.invoke('get-settings'),

  updateSettings: (partial: Partial<Settings>): Promise<Settings> =>
    ipcRenderer.invoke('update-settings', partial),

  // API Key
  getApiKey: (): Promise<string> =>
    ipcRenderer.invoke('get-api-key'),

  setApiKey: (key: string): Promise<void> =>
    ipcRenderer.invoke('set-api-key', key),

  testApiConnection: (apiKey: string): Promise<boolean> =>
    ipcRenderer.invoke('test-api-connection', apiKey),

  // Clipboard
  readClipboard: (): Promise<string> =>
    ipcRenderer.invoke('read-clipboard'),

  writeClipboard: (text: string): Promise<void> =>
    ipcRenderer.invoke('write-clipboard', text),

  // Window control
  hideWindow: (): Promise<void> =>
    ipcRenderer.invoke('hide-window'),

  toggleMiniMode: (): Promise<void> =>
    ipcRenderer.invoke('toggle-mini-mode'),

  showSettings: (): Promise<void> =>
    ipcRenderer.invoke('show-settings'),

  closeSettings: (): Promise<void> =>
    ipcRenderer.invoke('close-settings'),

  // History
  getHistory: (): Promise<Array<{ id: string; sourceText: string; translatedText: string; sourceLanguage: string; targetLanguage: string; timestamp: number }>> =>
    ipcRenderer.invoke('get-history'),

  addHistory: (entry: { sourceText: string; translatedText: string; sourceLanguage: string; targetLanguage: string }) =>
    ipcRenderer.invoke('add-history', entry),

  clearHistory: (): Promise<void> =>
    ipcRenderer.invoke('clear-history'),

  // Shortcuts
  updateShortcuts: (hotkey: string, miniHotkey: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('update-shortcuts', hotkey, miniHotkey),

  // Event listeners (main -> renderer)
  onSourceText: (callback: (text: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, text: string) => callback(text)
    ipcRenderer.on('source-text', handler)
    return () => ipcRenderer.removeListener('source-text', handler)
  },

  onModeChange: (callback: (mode: 'full' | 'mini') => void) => {
    const handler = (_event: Electron.IpcRendererEvent, mode: 'full' | 'mini') => callback(mode)
    ipcRenderer.on('mode-change', handler)
    return () => ipcRenderer.removeListener('mode-change', handler)
  }
})
