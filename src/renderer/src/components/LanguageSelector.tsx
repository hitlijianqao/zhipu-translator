const LANGUAGES = [
  { code: 'auto', label: '自动检测', flag: '' },
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' }
]

interface LanguageSelectorProps {
  value: string
  onChange: (lang: string) => void
  showAuto?: boolean
  className?: string
}

export default function LanguageSelector({ value, onChange, showAuto = false, className = '' }: LanguageSelectorProps) {
  const filtered = showAuto ? LANGUAGES : LANGUAGES.filter((l) => l.code !== 'auto')

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700
        rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300
        focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300 dark:focus:border-indigo-600
        cursor-pointer no-drag transition-all ${className}`}
    >
      {filtered.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  )
}
