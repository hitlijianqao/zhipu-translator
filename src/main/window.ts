import electron from 'electron'
const { BrowserWindow, screen } = electron
import path from 'path'
import { getSettings, getWindowState, setWindowState } from './store'

const POPUP_WIDTH = 420
const POPUP_HEIGHT = 380
const MINI_WIDTH = 280
const MINI_HEIGHT = 60
const SETTINGS_WIDTH = 560
const SETTINGS_HEIGHT = 520

let popupWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let isMiniMode = false

const PRELOAD_PATH = path.join(__dirname, '../preload/index.mjs')
const RENDERER_URL = process.env.ELECTRON_RENDERER_URL || ''

function getPopupUrl(mode: 'popup' | 'mini' | 'settings'): string {
  if (RENDERER_URL) {
    return `${RENDERER_URL}#/${mode}`
  }
  // Production: load built file
  return `file://${path.join(__dirname, '../renderer/index.html')}#/${mode}`
}

export function getOrCreatePopupWindow(): BrowserWindow {
  if (popupWindow && !popupWindow.isDestroyed()) {
    return popupWindow
  }

  const settings = getSettings()
  const savedState = getWindowState()

  const x = savedState?.x
  const y = savedState?.y
  const width = savedState?.width || POPUP_WIDTH
  const height = savedState?.height || POPUP_HEIGHT

  popupWindow = new BrowserWindow({
    width,
    height,
    minWidth: 300,
    minHeight: 200,
    x,
    y,
    alwaysOnTop: settings.alwaysOnTop,
    frame: false,
    resizable: true,
    skipTaskbar: true,
    show: false,
    hasShadow: true,
    webPreferences: {
      preload: PRELOAD_PATH,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // Save window state on resize (debounced)
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  popupWindow.on('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (popupWindow && !popupWindow.isDestroyed() && !isMiniMode) {
        const bounds = popupWindow.getBounds()
        setWindowState({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, isMini: false })
      }
    }, 500)
  })

  popupWindow.on('close', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      const bounds = popupWindow.getBounds()
      setWindowState({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMini: isMiniMode
      })
    }
    if (resizeTimer) clearTimeout(resizeTimer)
    popupWindow = null
    isMiniMode = false
  })

  return popupWindow
}

export function showTranslationPopup(text: string): void {
  const win = getOrCreatePopupWindow()

  // Position near cursor
  positionWindowNearCursor(win)

  // Load the popup content
  const url = getPopupUrl('popup')
  const needsLoad = win.webContents.getURL() !== url

  const sendText = () => {
    win.webContents.send('source-text', text)
  }

  if (needsLoad) {
    // Page needs to load first - wait for it, then send text
    win.webContents.once('did-finish-load', sendText)
    win.loadURL(url)
  } else {
    // Page already loaded - send immediately
    sendText()
  }

  // Show window and focus
  if (!win.isVisible()) {
    win.show()
  }
  win.focus()
}

export function hideTranslationPopup(): void {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.hide()
  }
}

export function toggleMiniMode(): void {
  const win = getOrCreatePopupWindow()

  if (isMiniMode) {
    // Restore from mini mode
    isMiniMode = false
    win.setSize(POPUP_WIDTH, POPUP_HEIGHT)
    win.setMinimumSize(300, 200)
    win.setResizable(true)
    const url = getPopupUrl('popup')
    if (win.webContents.getURL() !== url) {
      win.loadURL(url)
    }
    win.webContents.send('mode-change', 'full')
  } else {
    // Switch to mini mode
    isMiniMode = true
    win.setSize(MINI_WIDTH, MINI_HEIGHT)
    win.setMinimumSize(MINI_WIDTH, MINI_HEIGHT)
    win.setResizable(false)
    const url = getPopupUrl('mini')
    if (win.webContents.getURL() !== url) {
      win.loadURL(url)
    }
    win.webContents.send('mode-change', 'mini')
  }
}

export function setAlwaysOnTop(alwaysOnTop: boolean): void {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.setAlwaysOnTop(alwaysOnTop)
  }
}

export function getOrCreateSettingsWindow(): BrowserWindow {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return settingsWindow
  }

  settingsWindow = new BrowserWindow({
    width: SETTINGS_WIDTH,
    height: SETTINGS_HEIGHT,
    minWidth: 480,
    minHeight: 420,
    alwaysOnTop: false,
    frame: true,
    resizable: true,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: PRELOAD_PATH,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  const url = getPopupUrl('settings')
  settingsWindow.loadURL(url)

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show()
    settingsWindow?.focus()
  })

  settingsWindow.on('close', () => {
    settingsWindow = null
  })

  return settingsWindow
}

export function showSettingsWindow(): void {
  getOrCreateSettingsWindow()
}

export function closeSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close()
    settingsWindow = null
  }
}

function positionWindowNearCursor(win: BrowserWindow): void {
  const cursor = screen.getCursorScreenPoint()
  const winSize = win.getSize()
  const displays = screen.getAllDisplays()

  // Find the display containing the cursor
  const currentDisplay = displays.find((d) => {
    const { x, y, width, height } = d.bounds
    return (
      cursor.x >= x &&
      cursor.x <= x + width &&
      cursor.y >= y &&
      cursor.y <= y + height
    )
  }) || screen.getPrimaryDisplay()

  const { x: dx, y: dy, width: dw, height: dh } = currentDisplay.workArea

  // Position below and to the right of cursor
  let winX = cursor.x + 10
  let winY = cursor.y + 10

  // Adjust if window would go off-screen
  if (winX + winSize[0] > dx + dw) {
    winX = cursor.x - winSize[0] - 10
  }
  if (winY + winSize[1] > dy + dh) {
    winY = cursor.y - winSize[1] - 10
  }

  // Ensure window is at least partially on screen
  winX = Math.max(dx + 10, Math.min(winX, dx + dw - winSize[0] - 10))
  winY = Math.max(dy + 10, Math.min(winY, dy + dh - winSize[1] - 10))

  win.setPosition(Math.round(winX), Math.round(winY))
}

export function getIsMiniMode(): boolean {
  return isMiniMode
}
