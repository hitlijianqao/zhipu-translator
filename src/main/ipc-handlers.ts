import electron from 'electron'
const { ipcMain } = electron
import { translateText, testApiConnection, TranslateRequest } from './translator'
import { getApiKey, getSettings, updateSettings, setApiKey } from './store'
import { readClipboardText, writeClipboardText } from './clipboard'
import { hideTranslationPopup, toggleMiniMode, setAlwaysOnTop, showSettingsWindow, closeSettingsWindow } from './window'
import { registerShortcuts, unregisterAll, isShortcutValid } from './shortcut'

export function registerIpcHandlers(
  onTranslateCallback: () => void
): void {
  ipcMain.handle('translate-text', async (_event, request: TranslateRequest) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      return {
        translatedText: '',
        sourceLanguage: request.sourceLang || 'auto',
        targetLanguage: request.targetLang,
        error: '请先在设置中配置 API Key'
      }
    }
    const settings = getSettings()
    return translateText(apiKey, request, settings.model, settings.customPrompt)
  })

  ipcMain.handle('get-settings', () => getSettings())

  ipcMain.handle('update-settings', (_event, partial: Record<string, unknown>) => {
    const updated = updateSettings(partial as Partial<ReturnType<typeof getSettings>>)
    if ('alwaysOnTop' in partial) {
      setAlwaysOnTop(partial.alwaysOnTop as boolean)
    }
    return updated
  })

  ipcMain.handle('get-api-key', () => getApiKey())
  ipcMain.handle('set-api-key', (_event, key: string) => { setApiKey(key) })
  ipcMain.handle('test-api-connection', async (_event, apiKey: string) => testApiConnection(apiKey))
  ipcMain.handle('read-clipboard', () => readClipboardText())
  ipcMain.handle('write-clipboard', (_event, text: string) => { writeClipboardText(text) })
  ipcMain.handle('hide-window', () => { hideTranslationPopup() })
  ipcMain.handle('toggle-mini-mode', () => { toggleMiniMode() })
  ipcMain.handle('show-settings', () => { showSettingsWindow() })
  ipcMain.handle('close-settings', () => { closeSettingsWindow() })

  ipcMain.handle('update-shortcuts', (_event, hotkey: string, miniHotkey: string) => {
    if (!isShortcutValid(hotkey)) {
      return { success: false, error: '快捷键格式无效。至少需要一个修饰键（Ctrl/Shift/Alt）+ 一个字母键。' }
    }
    if (!isShortcutValid(miniHotkey)) {
      return { success: false, error: '迷你模式快捷键格式无效。' }
    }
    const ok = registerShortcuts(hotkey, miniHotkey, onTranslateCallback, toggleMiniMode)
    return { success: ok, error: ok ? undefined : '快捷键注册失败，可能被其他应用占用。' }
  })
}
