import electron from 'electron'
const { app } = electron
import { initStore, getSettings } from './store'
import { registerIpcHandlers } from './ipc-handlers'
import { registerShortcuts, unregisterAll } from './shortcut'
import { createTray } from './tray'
import { showTranslationPopup, showSettingsWindow, toggleMiniMode } from './window'
import { readClipboardText } from './clipboard'

let isQuitting = false

function handleTranslateTrigger(): void {
  const text = readClipboardText()
  if (text && text.trim().length > 0) {
    showTranslationPopup(text)
  } else {
    showTranslationPopup('')
  }
}

function handleMiniModeToggle(): void {
  toggleMiniMode()
}

app.whenReady().then(() => {
  initStore()
  const settings = getSettings()

  registerIpcHandlers(handleTranslateTrigger)
  registerShortcuts(settings.hotKey, settings.miniModeHotKey, handleTranslateTrigger, handleMiniModeToggle)
  createTray(showSettingsWindow, handleTranslateTrigger)

  app.on('before-quit', () => { isQuitting = true })
  app.on('will-quit', () => { unregisterAll() })

  if (settings.launchAtStartup) {
    app.setLoginItemSettings({ openAtLogin: true })
  }
})

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => { handleTranslateTrigger() })
}
