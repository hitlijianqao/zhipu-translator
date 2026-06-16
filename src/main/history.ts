import electron from 'electron'
const { app } = electron
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface HistoryEntry {
  id: string
  sourceText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: number
}

const MAX_HISTORY = 50

function getHistoryPath(): string {
  const dir = join(app.getPath('userData'))
  try { mkdirSync(dir, { recursive: true }) } catch { /* exists */ }
  return join(dir, 'history.json')
}

export function loadHistory(): HistoryEntry[] {
  try {
    const p = getHistoryPath()
    if (!existsSync(p)) return []
    const data = readFileSync(p, 'utf-8')
    return JSON.parse(data) as HistoryEntry[]
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    writeFileSync(getHistoryPath(), JSON.stringify(entries.slice(0, MAX_HISTORY), null, 2), 'utf-8')
  } catch { /* ignore */ }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry[] {
  const entries = loadHistory()
  const newEntry: HistoryEntry = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now()
  }
  entries.unshift(newEntry)
  if (entries.length > MAX_HISTORY) entries.pop()
  saveHistory(entries)
  return entries
}

export function clearHistory(): void {
  saveHistory([])
}
