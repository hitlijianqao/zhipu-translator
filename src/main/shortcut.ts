import electron from 'electron'
const { globalShortcut } = electron

let currentHotkey: string | null = null
let currentMiniHotkey: string | null = null
let translationCallback: (() => void) | null = null
let miniModeCallback: (() => void) | null = null

export function registerShortcuts(
  hotkey: string,
  miniHotkey: string,
  onTranslate: () => void,
  onMiniMode: () => void
): boolean {
  unregisterAll()

  translationCallback = onTranslate
  miniModeCallback = onMiniMode

  let success = true

  try {
    const ok = globalShortcut.register(hotkey, () => {
      translationCallback?.()
    })
    if (ok) {
      currentHotkey = hotkey
    } else {
      console.warn(`Failed to register hotkey: ${hotkey}`)
      success = false
    }
  } catch (e) {
    console.warn(`Error registering hotkey ${hotkey}:`, e)
    success = false
  }

  try {
    const ok = globalShortcut.register(miniHotkey, () => {
      miniModeCallback?.()
    })
    if (ok) {
      currentMiniHotkey = miniHotkey
    } else {
      console.warn(`Failed to register mini mode hotkey: ${miniHotkey}`)
    }
  } catch (e) {
    console.warn(`Error registering mini hotkey ${miniHotkey}:`, e)
  }

  return success
}

export function unregisterAll(): void {
  try {
    globalShortcut.unregisterAll()
  } catch {
    // Ignore errors during unregistration
  }
  currentHotkey = null
  currentMiniHotkey = null
}

export function isShortcutValid(shortcut: string): boolean {
  if (!shortcut || shortcut.trim() === '') return false
  const hasModifier = /^(Ctrl|Cmd|Alt|Shift|Super)\+/.test(shortcut)
  const reserved = ['Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+Z', 'Ctrl+Y', 'Alt+F4', 'Ctrl+Alt+Delete']
  return hasModifier && !reserved.includes(shortcut)
}
