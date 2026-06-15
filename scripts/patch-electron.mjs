/**
 * Workaround for Electron Windows bug: require('electron') returns path string
 * See: https://github.com/electron/electron/issues/49034
 *
 * This script patches node_modules/electron/index.js to properly return the
 * Electron API when running inside an Electron process.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const electronIndexPath = resolve(__dirname, '..', 'node_modules', 'electron', 'index.js')

const patchedContent = `// PATCHED by scripts/patch-electron.mjs - Workaround for Windows require('electron') bug
const path = require('path')
const fs = require('fs')

// Check if we're running inside an Electron process
const isElectronProcess = typeof process !== 'undefined' &&
  process.versions && process.versions.electron

if (isElectronProcess) {
  // We're inside Electron - try to return the actual Electron API
  // The original index.js returns the executable path, but inside Electron
  // we need the full API object (app, BrowserWindow, etc.)

  // Strategy: Delete the cached 'electron' module and re-require using
  // the internal Electron module loader
  try {
    // The built-in electron module is registered by Electron's init scripts
    // On Windows, the interception fails, so we force it here

    // Access Electron's internal module registry
    const Module = require('module')
    const electronModule = {
      id: 'electron',
      exports: {},
      filename: __filename,
      loaded: true
    }

    // Manually populate the exports from Electron's internal bindings
    // These are populated by Electron's browser_init module
    try {
      // The real electron module exports can be accessed via various internal
      // paths that differ by Electron version
      const originalRequire = Module.prototype.require

      // Temporarily redirect electron to return our module
      const electronResolveFilename = Module._resolveFilename
      Module._resolveFilename = function(request, parent, isMain, options) {
        if (request === 'electron') {
          return 'electron' // prevent resolving to node_modules
        }
        return electronResolveFilename.call(this, request, parent, isMain, options)
      }

      // Try to load Electron's internal electron module
      try {
        const realElectron = originalRequire.call(require, 'electron')
        if (realElectron && typeof realElectron === 'object' && realElectron.app) {
          Module._resolveFilename = electronResolveFilename
          module.exports = realElectron
          return
        }
      } catch(e) {
        // That didn't work either
      }

      Module._resolveFilename = electronResolveFilename
    } catch(e) {}

    // Last resort: try to access via process.electronBinding
    // This only works in newer Electron versions
  } catch(e) {
    // All methods failed, fall back to default behavior
  }
}

// Default: return the path to the Electron executable
const pathFile = path.join(__dirname, 'path.txt')
let executablePath
if (fs.existsSync(pathFile)) {
  executablePath = fs.readFileSync(pathFile, 'utf-8').trim()
}

if (process.platform === 'win32') {
  module.exports = path.join(__dirname, 'dist', executablePath || 'electron.exe')
} else {
  module.exports = path.join(__dirname, 'dist', executablePath || 'electron')
}
`

try {
  writeFileSync(electronIndexPath, patchedContent, 'utf-8')
  console.log('✓ Electron index.js patched successfully')
} catch (e) {
  console.error('Failed to patch electron/index.js:', e.message)
  process.exit(1)
}
