const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

export interface TranslateRequest {
  text: string
  sourceLang?: string
  targetLang: string
}

export interface TranslationResult {
  translatedText: string
  detectedLanguage?: string
  sourceLanguage: string
  targetLanguage: string
  error?: string
}

const LANGUAGE_NAMES: Record<string, string> = {
  'auto': 'the detected source language',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
  'en': 'English',
  'ja': 'Japanese',
  'ko': 'Korean',
  'fr': 'French',
  'de': 'German',
  'es': 'Spanish',
  'ru': 'Russian',
  'pt': 'Portuguese',
  'it': 'Italian',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'ar': 'Arabic',
  'id': 'Indonesian',
  'tr': 'Turkish',
}

function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code
}

function buildSystemPrompt(sourceLang: string, targetLang: string): string {
  const sourceName = sourceLang === 'auto'
    ? 'the detected source language'
    : getLanguageName(sourceLang)
  const targetName = getLanguageName(targetLang)

  return `You are a professional translator. Translate the user's text from ${sourceName} to ${targetName}.

Rules:
1. Translate ONLY the text content. Do NOT add explanations, notes, or commentary.
2. Preserve formatting: line breaks, paragraphs, bullet points, and numbered lists.
3. If the input contains code, translate only comments and string literals — preserve code syntax exactly.
4. For technical terms, use the most commonly accepted translation.
5. If the source language is "auto", first detect the language of the input text.
6. Output your response as a JSON object with the following format:
{
  "translation": "the translated text here",
  "detected_language": "language code (only include when source is auto, use BCP-47 codes like en, zh-CN, ja, ko, fr, de, es, ru, pt, it, th, vi, ar, id, tr)"
}
7. If the input text appears to already be in the target language, return it as-is with detected_language set to the target language code.
8. Keep the translation natural and fluent. Avoid literal/word-for-word translations.`
}

export async function translateText(
  apiKey: string,
  request: TranslateRequest,
  model = 'glm-4-flash',
  customPrompt?: string
): Promise<TranslationResult> {
  const { text, sourceLang = 'auto', targetLang } = request

  if (!text || !text.trim()) {
    return {
      translatedText: '',
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      error: 'No text to translate'
    }
  }

  let systemPrompt: string
  if (customPrompt && customPrompt.trim()) {
    // Use custom prompt with variable substitution
    systemPrompt = customPrompt
      .replace(/\{sourceLang\}/g, sourceLang === 'auto' ? '自动检测' : getLanguageName(sourceLang))
      .replace(/\{targetLang\}/g, getLanguageName(targetLang))
      .replace(/\{sourceCode\}/g, sourceLang)
      .replace(/\{targetCode\}/g, targetLang)
  } else {
    systemPrompt = buildSystemPrompt(sourceLang, targetLang)
  }

  const body = {
    model,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: text }
    ],
    temperature: 0.3,
    max_tokens: 4096,
    top_p: 0.9
  }

  try {
    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      if (response.status === 401) {
        return { translatedText: '', sourceLanguage: sourceLang, targetLanguage: targetLang, error: '无效的 API Key，请检查设置。' }
      }
      if (response.status === 429) {
        return { translatedText: '', sourceLanguage: sourceLang, targetLanguage: targetLang, error: '请求过于频繁，请稍后再试。' }
      }
      return { translatedText: '', sourceLanguage: sourceLang, targetLanguage: targetLang, error: `API 错误 (${response.status}): ${errorText}` }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return { translatedText: '', sourceLanguage: sourceLang, targetLanguage: targetLang, error: 'API 返回为空' }
    }

    return parseTranslationResponse(content, sourceLang, targetLang)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('fetch') || message.includes('network') || message.includes('ENOTFOUND')) {
      return { translatedText: '', sourceLanguage: sourceLang, targetLanguage: targetLang, error: '网络错误，请检查网络连接。' }
    }
    return { translatedText: '', sourceLanguage: sourceLang, targetLanguage: targetLang, error: `翻译失败: ${message}` }
  }
}

function parseTranslationResponse(
  content: string,
  sourceLang: string,
  targetLang: string
): TranslationResult {
  try {
    // Try parsing as JSON from system prompt instruction
    const trimmed = content.trim()
    // Handle markdown code blocks
    let jsonStr = trimmed
    if (trimmed.startsWith('```')) {
      const lines = trimmed.split('\n')
      jsonStr = lines.slice(1, lines.length - 1).join('\n').trim()
    }
    const parsed = JSON.parse(jsonStr)
    return {
      translatedText: parsed.translation || '',
      detectedLanguage: parsed.detected_language,
      sourceLanguage: parsed.detected_language || sourceLang,
      targetLanguage: targetLang
    }
  } catch {
    // Model didn't return JSON; use raw content as translation
    return {
      translatedText: content.trim(),
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    }
  }
}

export async function testApiConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      })
    })
    return response.ok
  } catch {
    return false
  }
}
