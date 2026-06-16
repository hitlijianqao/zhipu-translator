import { useState, useEffect } from 'react'

interface HistoryEntry {
  id: string
  sourceText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: number
}

const LANG_SHORT: Record<string, string> = {
  'zh-CN': '中', 'zh-TW': '繁', 'en': 'EN', 'ja': '日', 'ko': '韩',
  'fr': 'FR', 'de': 'DE', 'es': 'ES', 'ru': 'RU', 'pt': 'PT',
  'it': 'IT', 'th': 'TH', 'vi': 'VI', 'ar': 'AR', 'id': 'ID', 'tr': 'TR',
  'auto': '自动'
}

interface Props {
  onSelect: (entry: { sourceText: string; sourceLanguage: string; targetLanguage: string }) => void
  onClose: () => void
}

export default function HistoryPanel({ onSelect, onClose }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    window.api.getHistory().then(setEntries)
  }, [])

  const filtered = search.trim()
    ? entries.filter(e =>
        e.sourceText.toLowerCase().includes(search.toLowerCase()) ||
        e.translatedText.toLowerCase().includes(search.toLowerCase())
      )
    : entries

  const handleClear = async () => {
    await window.api.clearHistory()
    setEntries([])
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
      {/* Header */}
      <div className="drag-area flex items-center justify-between px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">翻译历史</span>
        <div className="flex items-center gap-1 no-drag">
          {entries.length > 0 && (
            <button onClick={handleClear} className="text-[10px] px-2 py-0.5 text-slate-400 hover:text-red-500 transition-colors">清空</button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索翻译记录..."
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 no-drag"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            {search ? '无匹配结果' : '暂无翻译历史'}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(e => (
              <button
                key={e.id}
                onClick={() => onSelect({ sourceText: e.sourceText, sourceLanguage: e.sourceLanguage, targetLanguage: e.targetLanguage })}
                className="w-full text-left p-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-slate-400">{formatTime(e.timestamp)}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                    {LANG_SHORT[e.sourceLanguage] || e.sourceLanguage} → {LANG_SHORT[e.targetLanguage] || e.targetLanguage}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{e.sourceText}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">{e.translatedText}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
