import electron from 'electron'
const { clipboard } = electron

export function readClipboardText(): string {
  try { return clipboard.readText() } catch { return '' }
}

export function writeClipboardText(text: string): void {
  clipboard.writeText(text)
}
