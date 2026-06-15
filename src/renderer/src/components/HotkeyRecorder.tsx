import { useState, useCallback } from 'react'

interface HotkeyRecorderProps {
  value: string
  onChange: (shortcut: string) => void
}

export default function HotkeyRecorder({ value, onChange }: HotkeyRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [displayKeys, setDisplayKeys] = useState(value)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!recording) return
      e.preventDefault()
      e.stopPropagation()

      const keys: string[] = []
      if (e.ctrlKey) keys.push('Ctrl')
      if (e.shiftKey) keys.push('Shift')
      if (e.altKey) keys.push('Alt')
      if (e.metaKey) keys.push('Win')

      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        setDisplayKeys(keys.join('+') || '按下组合键...')
        return
      }

      const key = e.key === ' ' ? 'Space' : e.key.toUpperCase()
      keys.push(key)
      const shortcut = keys.join('+')
      setDisplayKeys(shortcut)
      setRecording(false)
      onChange(shortcut)
    },
    [recording, onChange]
  )

  const handleBlur = () => {
    setRecording(false)
    setDisplayKeys(value)
  }

  const formatKeys = (s: string) => {
    return s.split('+').map(k => (
      <span key={k} className="inline-block bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold mx-0.5">{k}</span>
    ))
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setRecording(true)}
      onBlur={handleBlur}
      className={`px-3.5 py-2.5 border rounded-lg text-sm cursor-pointer select-none transition-all ${
        recording
          ? 'border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {recording ? (
        <span className="text-indigo-500 font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          按下快捷键...
        </span>
      ) : displayKeys ? (
        <span className="flex items-center flex-wrap gap-0.5 text-slate-700 dark:text-slate-300">
          {formatKeys(displayKeys)}
        </span>
      ) : (
        <span className="text-slate-400">点击设置快捷键</span>
      )}
    </div>
  )
}
