import { useEffect, useCallback, useState, useRef } from 'react'
import { useTranslationStore } from '../store/translationStore'
import LanguageSelector from './LanguageSelector'
import { speak } from '../utils/tts'
import HistoryPanel from './HistoryPanel'

const LANG_NAMES: Record<string, string> = {
  'zh-CN': '简体中文', 'zh-TW': '繁體中文', 'en': 'English',
  'ja': '日本語', 'ko': '한국어', 'fr': 'Français', 'de': 'Deutsch',
  'es': 'Español', 'ru': 'Русский', 'pt': 'Português',
  'it': 'Italiano', 'th': 'ไทย', 'vi': 'Tiếng Việt',
  'ar': 'العربية', 'id': 'Bahasa Indonesia', 'tr': 'Türkçe'
}

export default function TranslationPopup() {
  const {
    sourceText, detectedLanguage, translation, isTranslating, error,
    sourceLanguage, targetLanguage,
    setSourceLanguage, setTargetLanguage, swapLanguages,
    setTranslating, setResult, setError, setSourceText
  } = useTranslationStore()

  const [inputText, setInputText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fromHotkey = useRef(false)
  const [copyAnim, setCopyAnim] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const doTranslate = useCallback(async (text: string) => {
    if (!text || !text.trim()) return
    setSourceText(text)
    setTranslating(true)
    try {
      const result = await window.api.translateText({
        text: text.trim(),
        sourceLang: sourceLanguage,
        targetLang: targetLanguage
      })
      setResult(result)
      if (result.error) {
        setError(result.error)
      }
      if (!result.error && result.translatedText) {
        // Save to history
        window.api.addHistory({
          sourceText: text.trim(),
          translatedText: result.translatedText,
          sourceLanguage: result.sourceLanguage || sourceLanguage,
          targetLanguage: result.targetLanguage || targetLanguage
        }).catch(() => {})
        const settings = await window.api.getSettings()
        if (settings.autoCopy) {
          window.api.writeClipboard(result.translatedText)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '翻译请求失败')
    }
  }, [sourceLanguage, targetLanguage, setTranslating, setResult, setError, setSourceText])

  useEffect(() => {
    const unsub = window.api.onSourceText((text: string) => {
      if (text && text.trim()) {
        fromHotkey.current = true
        setInputText(text)
        window.api.getSettings().then((settings) => {
          if (settings.sourceLanguage !== sourceLanguage) setSourceLanguage(settings.sourceLanguage)
          if (settings.targetLanguage !== targetLanguage) setTargetLanguage(settings.targetLanguage)
        })
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (fromHotkey.current && inputText.trim()) {
      fromHotkey.current = false
      doTranslate(inputText)
    }
  }, [inputText])

  useEffect(() => {
    if (sourceText && sourceText.trim() && (translation || error)) {
      doTranslate(sourceText)
    }
  }, [sourceLanguage, targetLanguage])

  const handleManualTranslate = () => {
    if (inputText.trim()) doTranslate(inputText)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      handleManualTranslate()
    }
  }

  const handleCopy = async () => {
    if (translation) {
      await window.api.writeClipboard(translation)
      setCopyAnim(true)
      setTimeout(() => setCopyAnim(false), 1500)
    }
  }

  const handlePasteFromClipboard = async () => {
    const text = await window.api.readClipboard()
    if (text && text.trim()) {
      setInputText(text)
      doTranslate(text)
    }
  }

  const getDetectedLabel = () => {
    if (detectedLanguage) return LANG_NAMES[detectedLanguage] || detectedLanguage
    return null
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl shadow-slate-400/20 dark:shadow-black/40 overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
      {/* Title Bar */}
      <div className="drag-area flex items-center justify-between px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide no-select">TRANS</span>
        </div>
        <div className="flex items-center gap-0.5 no-drag">
          <button onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-lg transition-colors ${showHistory ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="翻译历史">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button onClick={window.api.toggleMiniMode}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="迷你模式">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button onClick={() => window.api.showSettings()}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="设置">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button onClick={() => window.api.hideWindow()}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 transition-colors ml-1"
            title="关闭">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showHistory ? (
        <HistoryPanel
          onSelect={({ sourceText, sourceLanguage: sl, targetLanguage: tl }) => {
            setSourceLanguage(sl)
            setTargetLanguage(tl)
            setInputText(sourceText)
            setShowHistory(false)
          }}
          onClose={() => setShowHistory(false)}
        />
      ) : (
        <>
          {/* Input Area */}
          <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {detectedLanguage && (
              <span className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">
                {getDetectedLabel()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handlePasteFromClipboard}
              className="text-[11px] px-2.5 py-0.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-full transition-colors font-medium">
              从剪贴板粘贴
            </button>
            {inputText.trim() && (
              <button
                onClick={() => speak(inputText, detectedLanguage || sourceLanguage)}
                className="p-1 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                title="朗读原文">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.5l-2.5 3H2v3h2l2.5 3h1v-9h-1zM20 12h-2" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入文字翻译，或 Ctrl+C 复制文字后按 Ctrl+Shift+T"
          rows={3}
          className="w-full resize-none text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300 dark:focus:border-indigo-600 transition-all no-drag"
        />
        <div className="flex justify-end mt-1.5">
          <button onClick={handleManualTranslate} disabled={isTranslating || !inputText.trim()}
            className="px-5 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg shadow-sm shadow-indigo-500/25 hover:shadow-md hover:shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97]">
            {isTranslating ? '翻译中...' : '翻译'}
          </button>
        </div>
      </div>

      {/* Language Bar */}
      <div className="flex items-center justify-center gap-1.5 px-4 py-2.5">
        <LanguageSelector value={sourceLanguage} onChange={setSourceLanguage} showAuto={true} className="flex-1" />
        <button onClick={swapLanguages}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-all flex-shrink-0"
          title="交换语言">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
        <LanguageSelector value={targetLanguage} onChange={setTargetLanguage} showAuto={false} className="flex-1" />
      </div>

      {/* Result Area */}
      <div className="flex-1 px-4 pb-3 min-h-0">
        <div className="h-full rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30">
          {isTranslating ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2.5 text-slate-400">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">翻译中...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-500 text-center max-w-[280px]">{error}</p>
              <button onClick={() => doTranslate(sourceText)}
                className="px-4 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors">
                重试
              </button>
            </div>
          ) : translation ? (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-slate-700 dark:text-slate-300">
              {translation}
            </p>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">输入文字并点击「翻译」<br/>或选中文本后按 Ctrl+Shift+T</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      {translation && !error && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
          <button onClick={() => doTranslate(sourceText)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            重新翻译
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 active:scale-[0.97] ${
                copyAnim
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm shadow-indigo-500/25 hover:shadow-md hover:shadow-indigo-500/30'
              }`}>
              {copyAnim ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  已复制
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制
                </>
              )}
            </button>
            <button
              onClick={() => speak(translation, targetLanguage)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
              title="朗读翻译">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.5l-2.5 3H2v3h2l2.5 3h1v-9h-1zM20 12h-2" />
              </svg>
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
