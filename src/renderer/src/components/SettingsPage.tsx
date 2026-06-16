import { useState, useEffect, useCallback } from 'react'
import HotkeyRecorder from './HotkeyRecorder'
import LanguageSelector from './LanguageSelector'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    const s = await window.api.getSettings()
    setSettings(s)
    const key = await window.api.getApiKey()
    setApiKey(key)
  }

  const handleSave = useCallback(async () => {
    if (!settings) return
    setSaving(true)
    try {
      await window.api.setApiKey(apiKey)
      await window.api.updateSettings(settings)
      await window.api.updateShortcuts(settings.hotKey, settings.miniModeHotKey)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error('Save failed:', e) }
    setSaving(false)
  }, [settings, apiKey])

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const ok = await window.api.testApiConnection(apiKey)
      setTestResult(ok ? 'success' : 'fail')
    } catch { setTestResult('fail') }
    setTesting(false)
  }

  const handleClose = async () => {
    await handleSave()
    window.api.closeSettings()
  }

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  const SectionTitle = ({ children }: { children: string }) => (
    <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
      <span className="w-1 h-3 rounded-full bg-indigo-400/60" />
      {children}
    </h2>
  )

  return (
    <div className="h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <div className="drag-area flex items-center justify-between px-6 py-3.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
          <h1 className="text-base font-bold tracking-tight">设置</h1>
        </div>
        <button onClick={handleClose}
          className="no-drag px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg shadow-sm shadow-indigo-500/25 transition-all active:scale-[0.97]">
          完成
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
        {/* API */}
        <section>
          <SectionTitle>API 配置</SectionTitle>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-400">API Key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="输入智谱 API Key"
                    className="w-full px-3.5 py-2 pr-10 border border-slate-200 dark:border-slate-700 rounded-lg text-sm
                      bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300 transition-all"
                  />
                  <button onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" tabIndex={-1}>
                    {showApiKey ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                <button onClick={handleTestConnection} disabled={testing || !apiKey}
                  className="px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap transition-colors">
                  {testing ? '测试中...' : '测试连接'}
                </button>
              </div>
              {testResult === 'success' && <p className="mt-1.5 text-xs text-emerald-500 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-400" />连接成功</p>}
              {testResult === 'fail' && <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-400" />连接失败，请检查 API Key</p>}
            </div>
          </div>
        </section>

        {/* Shortcuts */}
        <section>
          <SectionTitle>快捷键</SectionTitle>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-400">翻译快捷键</label>
              <HotkeyRecorder value={settings.hotKey} onChange={(v) => updateSetting('hotKey', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-400">迷你模式快捷键</label>
              <HotkeyRecorder value={settings.miniModeHotKey} onChange={(v) => updateSetting('miniModeHotKey', v)} />
            </div>
          </div>
        </section>

        {/* Default Language */}
        <section>
          <SectionTitle>默认语言</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-400">源语言</label>
              <LanguageSelector value={settings.sourceLanguage} onChange={(v) => updateSetting('sourceLanguage', v)} showAuto={true} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-400">目标语言</label>
              <LanguageSelector value={settings.targetLanguage} onChange={(v) => updateSetting('targetLanguage', v)} showAuto={false} className="w-full" />
            </div>
          </div>
        </section>

        {/* Behavior */}
        <section>
          <SectionTitle>行为设置</SectionTitle>
          <div className="space-y-1">
            {[
              { key: 'autoCopy' as const, label: '翻译后自动复制结果' },
              { key: 'alwaysOnTop' as const, label: '翻译窗口保持置顶' },
              { key: 'launchAtStartup' as const, label: '开机自动启动' },
              { key: 'floatTranslate' as const, label: '鼠标选中文字自动翻译' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                  settings[key] ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    settings[key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                  <input type="checkbox" checked={settings[key]}
                    onChange={(e) => updateSetting(key, e.target.checked)}
                    className="sr-only" />
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Model */}
        <section>
          <SectionTitle>模型</SectionTitle>
          <select value={settings.model} onChange={(e) => updateSetting('model', e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm
              bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-200
              focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300 transition-all cursor-pointer">
            <option value="glm-4-flash">GLM-4-Flash (快速)</option>
            <option value="glm-4">GLM-4 (标准)</option>
            <option value="glm-4-plus">GLM-4-Plus (高质量)</option>
          </select>
        </section>

        {/* Custom Prompt */}
        <section>
          <SectionTitle>自定义翻译提示词</SectionTitle>
          <textarea value={settings.customPrompt || ''} onChange={(e) => updateSetting('customPrompt', e.target.value)}
            placeholder="留空使用默认提示词。可用变量：{sourceLang} 源语言名、{targetLang} 目标语言名"
            rows={4}
            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm
              bg-white dark:bg-slate-900/50 resize-none text-slate-700 dark:text-slate-200 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300 transition-all" />
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            可用变量：<code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">{'{sourceLang}'}</code>{' '}
            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">{'{targetLang}'}</code>
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 border-t border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-between">
        <span className="text-xs text-slate-400">Trans v1.0.0</span>
        <button onClick={handleSave} disabled={saving}
          className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all active:scale-[0.97] ${
            saved
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm shadow-indigo-500/25 hover:shadow-md'
          } disabled:opacity-50`}>
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存设置'}
        </button>
      </div>
    </div>
  )
}
