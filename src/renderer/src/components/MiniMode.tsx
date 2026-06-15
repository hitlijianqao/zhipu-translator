import { useEffect, useState } from 'react'
import { useTranslationStore } from '../store/translationStore'

export default function MiniMode() {
  const { sourceText, translation, isTranslating, error, targetLanguage } = useTranslationStore()
  const [copyAnim, setCopyAnim] = useState(false)

  useEffect(() => {
    const unsub = window.api.onSourceText((text: string) => {
      useTranslationStore.getState().setSourceText(text)
      window.api.getSettings().then((settings) => {
        useTranslationStore.getState().setTargetLanguage(settings.targetLanguage)
      })
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (sourceText && sourceText.trim()) {
      const store = useTranslationStore.getState()
      store.setTranslating(true)
      window.api.translateText({
        text: sourceText.trim(),
        sourceLang: 'auto',
        targetLang: targetLanguage
      }).then((result) => {
        store.setResult(result)
      }).catch((err) => {
        store.setError(err instanceof Error ? err.message : '翻译失败')
      })
    }
  }, [sourceText, targetLanguage])

  const handleCopy = async () => {
    if (translation) {
      await window.api.writeClipboard(translation)
      setCopyAnim(true)
      setTimeout(() => setCopyAnim(false), 1500)
    }
  }

  return (
    <div className="w-full h-full flex items-center bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-100 shadow-lg overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/60">
      {/* Drag handle */}
      <div className="drag-area w-1.5 h-full bg-slate-200/50 dark:bg-slate-700/50 cursor-move flex-shrink-0 hover:bg-indigo-300/50 dark:hover:bg-indigo-700/50 transition-colors" />

      {/* Content */}
      <div className="flex-1 flex items-center px-2.5 py-1 min-w-0 gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-400/50" />
        {isTranslating ? (
          <div className="flex items-center gap-1.5 text-slate-400">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">翻译中...</span>
          </div>
        ) : error ? (
          <span className="text-xs text-red-400 truncate">{error}</span>
        ) : (
          <p className="text-xs truncate flex-1 text-slate-600 dark:text-slate-300">{translation || '等待翻译...'}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 px-1.5 no-drag flex-shrink-0">
        {translation && (
          <button onClick={handleCopy}
            className={`p-1 rounded-lg transition-all ${
              copyAnim ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`} title="复制">
            {copyAnim ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
          </button>
        )}
        <button onClick={() => window.api.toggleMiniMode()}
          className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="展开">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
        </button>
        <button onClick={() => window.api.hideWindow()}
          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors" title="关闭">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}
