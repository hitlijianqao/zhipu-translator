import electron from 'electron'
const { app } = electron
import { initStore, getSettings } from './store'
import { registerIpcHandlers } from './ipc-handlers'
import { registerShortcuts, unregisterAll } from './shortcut'
import { createTray } from './tray'
import { showTranslationPopup, showSettingsWindow, getIsMiniMode, hideTranslationPopup, toggleMiniMode } from './window'
import { getSelectedText } from './clipboard'

let isQuitting = false

function handleTranslateTrigger(): void {
  const text = getSelectedText()
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
  // Initialize persistent store
  initStore()
  const settings = getSettings()

  // Register IPC handlers
  registerIpcHandlers(handleTranslateTrigger)

  // Register global shortcuts
  registerShortcuts(
    settings.hotKey,
    settings.miniModeHotKey,
    handleTranslateTrigger,
    handleMiniModeToggle
  )

  // Create system tray
  createTray(showSettingsWindow, handleTranslateTrigger)

  // Handle app lifecycle
  app.on('activate', () => {
    // On macOS, re-create window or show popup
  })

  app.on('before-quit', () => {
    isQuitting = true
  })

  app.on('will-quit', () => {
    unregisterAll()
  })

  app.on('window-all-closed', () => {
    // Don't quit on Windows when all windows are closed - keeps tray alive
    if (process.platform !== 'darwin' && !isQuitting) {
      // Stay in tray
    }
  })

  // Configure auto-start if enabled
  if (settings.launchAtStartup) {
    app.setLoginItemSettings({ openAtLogin: true })
  }
})

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Focus existing instance
    handleTranslateTrigger()
  })
}
