import { spawn, ChildProcess } from 'child_process'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const SCRIPT_DIR = join(tmpdir(), 'zhipu-translator')
let hookProcess: ChildProcess | null = null
let lastTriggerTime = 0
let floatCallback: ((text: string) => void) | null = null
const DEBOUNCE_MS = 800

function ensureDir(): void {
  try { mkdirSync(SCRIPT_DIR, { recursive: true }) } catch { /* exists */ }
}

function getScriptPath(): string {
  ensureDir()
  const p = join(SCRIPT_DIR, 'float-translate.ps1')
  if (!existsSync(p)) {
    writeFileSync(p, `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Diagnostics;
using System.Windows.Automation;

public static class FloatTranslateHook {
    private const int WH_MOUSE_LL = 14;
    private const int WM_LBUTTONUP = 0x0202;
    private static IntPtr hookId = IntPtr.Zero;
    private static NativeMethods.LowLevelMouseProc proc;
    private static long lastUp = 0;
    private static readonly long DEBOUNCE = 700; // ms between triggers

    public static void Start() {
        proc = HookCallback;
        hookId = NativeMethods.SetWindowsHookEx(WH_MOUSE_LL, proc, IntPtr.Zero, 0);
        if (hookId == IntPtr.Zero) {
            Console.WriteLine("ERROR:hook_failed");
            return;
        }
        Console.WriteLine("READY");
        System.Windows.Forms.Application.Run();
    }

    public static void Stop() {
        if (hookId != IntPtr.Zero) {
            NativeMethods.UnhookWindowsHookEx(hookId);
            hookId = IntPtr.Zero;
        }
        System.Windows.Forms.Application.Exit();
    }

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0 && (int)wParam == WM_LBUTTONUP) {
            long now = DateTime.Now.Ticks / TimeSpan.TicksPerMillisecond;
            if (now - lastUp < DEBOUNCE) {
                return NativeMethods.CallNextHookEx(hookId, nCode, wParam, lParam);
            }
            lastUp = now;

            // Delay to let selection finalize, then read it
            System.Threading.ThreadPool.QueueUserWorkItem(_ => {
                System.Threading.Thread.Sleep(150);
                try {
                    string text = ReadSelection();
                    if (!string.IsNullOrEmpty(text) && text.Trim().Length >= 2) {
                        // Output JSON so we can pass structured data
                        string json = "{\\"text\\":\\"" + EscapeJson(text) + "\\"}";
                        Console.WriteLine(json);
                    }
                } catch {}
            });
        }
        return NativeMethods.CallNextHookEx(hookId, nCode, wParam, lParam);
    }

    private static string ReadSelection() {
        try {
            // First try: UIA TextPattern on focused element
            AutomationElement ae = AutomationElement.FocusedElement;
            if (ae == null) return null;

            object pattern;
            if (ae.TryGetCurrentPattern(TextPattern.Pattern, out pattern)) {
                TextPattern tp = (TextPattern)pattern;
                TextPatternRange[] ranges = tp.GetSelection();
                if (ranges != null && ranges.Length > 0) {
                    string text = ranges[0].GetText(-1);
                    if (!string.IsNullOrEmpty(text)) return text;
                }
            }

            // Second try: check if it's a text field with selected text
            if (ae.TryGetCurrentPattern(ValuePattern.Pattern, out pattern)) {
                // ValuePattern doesn't give selection, skip
            }

            return null;
        } catch {
            return null;
        }
    }

    private static string EscapeJson(string s) {
        return s.Replace("\\\\", "\\\\\\\\")
                .Replace("\\"", "\\\\\\"")
                .Replace("\\n", "\\\\n")
                .Replace("\\r", "\\\\r")
                .Replace("\\t", "\\\\t");
    }

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    private static class NativeMethods {
        public delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll")] public static extern IntPtr SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, IntPtr hMod, uint dwThreadId);
        [DllImport("user32.dll")] public static extern bool UnhookWindowsHookEx(IntPtr hhk);
        [DllImport("user32.dll")] public static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);
    }
}
"@

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms

[STAThread]
try {
    [FloatTranslateHook]::Start()
} catch {
    Console.WriteLine("ERROR:" + $_.Exception.Message)
}
`.trim())
  }
  return p
}

export function isFloatTranslateRunning(): boolean {
  return hookProcess !== null
}

export function startFloatTranslate(callback: (text: string) => void): void {
  if (hookProcess) return
  floatCallback = callback

  try {
    hookProcess = spawn('powershell', [
      '-STA', '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-File', getScriptPath()
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    })

    let ready = false
    let buffer = ''

    hookProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      if (!ready) {
        if (text.includes('READY')) ready = true
        else if (text.includes('ERROR')) console.error('[FloatTranslate] Init failed:', text.trim())
        return
      }

      buffer += text
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        // Parse JSON output from hook
        try {
          const parsed = JSON.parse(trimmed)
          if (parsed.text) {
            const now = Date.now()
            if (now - lastTriggerTime > DEBOUNCE_MS) {
              lastTriggerTime = now
              callback(parsed.text)
            }
          }
        } catch {
          // Non-JSON line, ignore
        }
      }
    })

    hookProcess.stderr?.on('data', (data: Buffer) => {
      console.error('[FloatTranslate]', data.toString().trim())
    })

    hookProcess.on('close', () => { hookProcess = null })
    hookProcess.on('error', () => { hookProcess = null })
  } catch {
    hookProcess = null
  }
}

export function stopFloatTranslate(): void {
  if (hookProcess) {
    try { hookProcess.kill() } catch { /* ignore */ }
    hookProcess = null
  }
}
