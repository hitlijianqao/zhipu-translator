import electron from 'electron'
const { Tray, Menu, nativeImage, app } = electron

let tray: Tray | null = null

export function createTray(
  onShowSettings: () => void,
  onTriggerTranslate: () => void
): Tray {
  // Create a simple 16x16 tray icon using data URL
  const icon = createTrayIconDataUrl()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '翻译 (Ctrl+Shift+T)',
      click: onTriggerTranslate
    },
    { type: 'separator' },
    {
      label: '设置',
      click: onShowSettings
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        ;(app as unknown as Record<string, boolean>).isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Trans - 桌面翻译')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', onTriggerTranslate)

  return tray
}

function createTrayIconDataUrl(): nativeImage {
  // Create 32x32 blue circle with white "T" using canvas via nativeImage
  const size = 32
  const img = nativeImage.createEmpty()

  // Use a simple 1x1 colored image scaled up, or create from data URL
  // Simple SVG-like approach via data URL with PNG
  const canvas = Buffer.alloc(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4
      // Draw a rounded blue square
      const isCorner =
        (x < 3 && y < 3) || (x >= size - 3 && y < 3) ||
        (x < 3 && y >= size - 3) || (x >= size - 3 && y >= size - 3)
      const isT =
        // Top bar of T
        (y >= 5 && y <= 9 && x >= 8 && x <= 23) ||
        // Vertical bar of T
        (y >= 10 && y <= 27 && x >= 13 && x <= 18)

      if (isCorner) {
        canvas[offset] = 0
        canvas[offset + 1] = 0
        canvas[offset + 2] = 0
        canvas[offset + 3] = 0 // transparent corners
      } else if (isT) {
        canvas[offset] = 255
        canvas[offset + 1] = 255
        canvas[offset + 2] = 255
        canvas[offset + 3] = 255 // white T
      } else {
        canvas[offset] = 59
        canvas[offset + 1] = 130
        canvas[offset + 2] = 246
        canvas[offset + 3] = 255 // blue background
      }
    }
  }

  return nativeImage.createFromBuffer(canvas, {
    width: size,
    height: size,
    scaleFactor: 1.0
  })
}

export function getTray(): Tray | null {
  return tray
}
