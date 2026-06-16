import electron from 'electron'
const { app } = electron
import { initStore, getSettings } from './store'
import { registerIpcHandlers } from './ipc-handlers'
import { registerShortcuts, unregisterAll } from './shortcut'
import { createTray } from './tray'
import { showTranslationPopup, showSettingsWindow, toggleMiniMode } from './window'
import { readClipboardText } from './clipboard'
import { startFloatTranslate, stopFloatTranslate } from './floatTranslate'

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

function toggleFloatMode(enabled: boolean): void {
  if (enabled) {
    startFloatTranslate((text) => {
      showTranslationPopup(text)
    })
  } else {
    stopFloatTranslate()
  }
}

app.whenReady().then(() => {
  initStore()
  const settings = getSettings()

  registerIpcHandlers(handleTranslateTrigger)
  registerShortcuts(settings.hotKey, settings.miniModeHotKey, handleTranslateTrigger, handleMiniModeToggle)
  createTray(showSettingsWindow, handleTranslateTrigger)

  // Start float translate if enabled
  if (process.platform === 'win32' && settings.floatTranslate) {
    toggleFloatMode(true)
  }

  app.on('before-quit', () => { isQuitting = true })
  app.on('will-quit', () => {
    unregisterAll()
    stopFloatTranslate()
  })

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

