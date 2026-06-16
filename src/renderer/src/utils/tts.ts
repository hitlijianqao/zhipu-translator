const LANG_TO_VOICE: Record<string, string> = {
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'en': 'en-US',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'es': 'es-ES',
  'ru': 'ru-RU',
  'pt': 'pt-PT',
  'it': 'it-IT',
  'th': 'th-TH',
  'vi': 'vi-VN',
  'ar': 'ar-SA',
  'id': 'id-ID',
  'tr': 'tr-TR',
}

export function speak(text: string, langCode: string): void {
  if (!text || !window.speechSynthesis) return

  // Stop any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANG_TO_VOICE[langCode] || langCode
  utterance.rate = 0.9 // Slightly slower for clarity
  utterance.pitch = 1.0

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices()
  const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]))
  if (matchingVoice) {
    utterance.voice = matchingVoice
  }

  window.speechSynthesis.speak(utterance)
}

export function stopSpeak(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
