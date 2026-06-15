import { create } from 'zustand'

interface TranslationState {
  sourceText: string
  detectedLanguage: string | null
  translation: string | null
  isTranslating: boolean
  error: string | null
  sourceLanguage: string
  targetLanguage: string

  setSourceText: (text: string) => void
  setSourceLanguage: (lang: string) => void
  setTargetLanguage: (lang: string) => void
  swapLanguages: () => void
  setTranslating: (isTranslating: boolean) => void
  setResult: (result: TranslationResult) => void
  setError: (error: string) => void
  clear: () => void
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  sourceText: '',
  detectedLanguage: null,
  translation: null,
  isTranslating: false,
  error: null,
  sourceLanguage: 'auto',
  targetLanguage: 'zh-CN',

  setSourceText: (text) => set({ sourceText: text, error: null }),

  setSourceLanguage: (lang) => set({ sourceLanguage: lang, detectedLanguage: null }),

  setTargetLanguage: (lang) => set({ targetLanguage: lang }),

  swapLanguages: () => {
    const { sourceLanguage, targetLanguage, detectedLanguage } = get()
    // Don't swap if source is 'auto'
    if (sourceLanguage === 'auto') {
      if (detectedLanguage) {
        set({
          sourceLanguage: targetLanguage,
          targetLanguage: detectedLanguage,
          detectedLanguage: null
        })
      }
      return
    }
    set({
      sourceLanguage: targetLanguage,
      targetLanguage: sourceLanguage,
      detectedLanguage: null
    })
  },

  setTranslating: (isTranslating) => set({ isTranslating, error: null }),

  setResult: (result) => set({
    translation: result.translatedText,
    detectedLanguage: result.detectedLanguage || null,
    isTranslating: false,
    error: result.error || null
  }),

  setError: (error) => set({ error, isTranslating: false }),

  clear: () => set({
    sourceText: '',
    detectedLanguage: null,
    translation: null,
    isTranslating: false,
    error: null
  })
}))
