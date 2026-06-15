import electron from 'electron'
import { execFileSync } from 'child_process'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
const { clipboard } = electron

// Cache paths for temp scripts
const SCRIPT_DIR = join(tmpdir(), 'zhipu-translator')

function ensureDir(): void {
  try { mkdirSync(SCRIPT_DIR, { recursive: true }) } catch { /* exists */ }
}

function getUiaScriptPath(): string {
  ensureDir()
  const p = join(SCRIPT_DIR, 'get-selection.ps1')
  if (!existsSync(p)) {
    writeFileSync(p, `
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
try {
  $ae = [System.Windows.Automation.AutomationElement]::FocusedElement
  if ($ae -eq $null) { exit 1 }
  $tp = [System.Windows.Automation.TextPattern]::Pattern
  if ([System.Windows.Automation.AutomationElementPattern]::TryGetCurrentPattern($ae, $tp, [ref]$null)) {
    $textPattern = $ae.GetCurrentPattern($tp)
    $ranges = $textPattern.GetSelection()
    if ($ranges -and $ranges.Count -gt 0) {
      $text = $ranges[0].GetText(-1)
      if ($text) {
        [Console]::Write($text)
        exit 0
      }
    }
  }
  exit 1
} catch {
  exit 1
}
`.trim())
  }
  return p
}

function getKeybdScriptPath(): string {
  ensureDir()
  const p = join(SCRIPT_DIR, 'send-ctrl-c.ps1')
  if (!existsSync(p)) {
    writeFileSync(p, `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class KB {
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}
'@
$CTRL = 0x11; $C = 0x43; $UP = 2
[KB]::keybd_event($CTRL, 0, 0, [UIntPtr]::Zero)
[KB]::keybd_event($C,    0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 50
[KB]::keybd_event($C,    0, $UP, [UIntPtr]::Zero)
[KB]::keybd_event($CTRL, 0, $UP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 120
`.trim())
  }
  return p
}

export function readClipboardText(): string {
  try { return clipboard.readText() } catch { return '' }
}

export function writeClipboardText(text: string): void {
  clipboard.writeText(text)
}

/**
 * Get selected text directly via Windows UI Automation.
 * This reads the text selection WITHOUT modifying the clipboard.
 * Falls back to simulating Ctrl+C if UIA fails.
 */
export function getSelectedText(): string {
  // Strategy 1: Check clipboard first (user might have pressed Ctrl+C)
  const existing = readClipboardText()
  if (existing && existing.trim().length > 0) {
    return existing
  }

  // Strategy 2: Try UI Automation (direct selection read, no clipboard)
  if (process.platform === 'win32') {
    try {
      const result = execFileSync('powershell', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass',
        '-File', getUiaScriptPath()
      ], { timeout: 3000, stdio: 'pipe', windowsHide: true })
      const text = result.toString().trim()
      if (text && text.length > 0) {
        return text
      }
    } catch {
      // UIA failed, fall through to Strategy 3
    }
  }

  // Strategy 3: Simulate Ctrl+C via keybd_event, then read clipboard
  if (process.platform === 'win32') {
    try {
      execFileSync('powershell', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass',
        '-File', getKeybdScriptPath()
      ], { timeout: 5000, stdio: 'ignore', windowsHide: true })
      return readClipboardText()
    } catch {
      // All strategies failed
    }
  } else if (process.platform === 'darwin') {
    try {
      execFileSync('osascript', [
        '-e', 'tell application "System Events" to keystroke "c" using command down'
      ], { timeout: 3000, stdio: 'ignore' })
      return readClipboardText()
    } catch { /* ignore */ }
  } else {
    try {
      execFileSync('xdotool', ['key', '--clearmodifiers', 'ctrl+c'],
        { timeout: 3000, stdio: 'ignore' })
      return readClipboardText()
    } catch { /* ignore */ }
  }

  return ''
}
