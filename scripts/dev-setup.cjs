/**
 * Dev-mode workaround for Electron Windows bug
 * See: https://github.com/electron/electron/issues/49034
 *
 * Problem: On Windows, require('electron') resolves to node_modules/electron/index.js
 * (which returns the executable path string) instead of Electron's built-in module.
 *
 * Solution: Rename index.js so Node.js can't resolve the npm package,
 * forcing Electron to use its built-in 'electron' module.
 * We keep the rest of the electron package for electron-vite to locate the binary.
 */

const fs = require('fs')
const path = require('path')

const electronDir = path.join(__dirname, '..', 'node_modules', 'electron')
const indexPath = path.join(electronDir, 'index.js')
const bakPath = path.join(electronDir, 'index.js.bak')

// Check if we're in an Electron dev environment
if (!fs.existsSync(electronDir)) {
  console.log('electron not installed yet, skipping patch')
  process.exit(0)
}

// Backup original
if (fs.existsSync(indexPath) && !fs.existsSync(bakPath)) {
  fs.renameSync(indexPath, bakPath)
  console.log('✓ electron/index.js → index.js.bak (dev workaround active)')
} else if (fs.existsSync(bakPath)) {
  console.log('✓ electron already patched (index.js.bak exists)')
} else {
  console.log('✓ no action needed')
}

// In newer Electron versions, we might also need to ensure
// the package.json doesn't have "main" pointing to a missing file
const pkgPath = path.join(electronDir, 'package.json')
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  if (pkg.main === 'index.js' && !fs.existsSync(indexPath)) {
    // Point to a stub that does nothing
    const stubPath = path.join(electronDir, 'stub.js')
    fs.writeFileSync(stubPath, '// stub\nmodule.exports = {};\n')
    pkg.main = 'stub.js'
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
    console.log('✓ electron package.json main → stub.js')
  }
}
