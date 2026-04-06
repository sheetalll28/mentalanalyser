import { analyzeEmotion, getChatbotResponse, getInsightForEmotion, type Emotion, type EmotionAnalysisResult } from './emotion-analysis'
import type { MoodEntry } from './supabase'
import { generateSummaryFromEntries } from './summarization'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL = 'gemini-1.5-flash'
const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

type GContent = { role: 'user' | 'model'; parts: [{ text: string }] }

async function callGemini(contents: GContent[], systemInstruction?: string): Promise<string> {
  if (!API_KEY) throw new Error('No Gemini API key configured')

  const body: Record<string, unknown> = { contents }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(`${BASE}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gemini ${res.status}: ${err?.error?.message ?? res.statusText}`)
  }

  const data = await res.json()
  return data.candidates[0].content.parts[0].text as string
}

// ── Emotion Analysis ──────────────────────────────────────────────────────────

export async function analyzeEmotionWithGemini(text: string): Promise<EmotionAnalysisResult> {
  const prompt = `You are an expert at emotional intelligence. Analyze this mood journal entry and respond with ONLY a raw JSON object — no markdown, no code fences, no explanation.

{
  "emotion": "<exactly one of: happy, sad, anxious, calm, excited, tired, stressed, neutral>",
  "confidence": <integer between 45 and 95>,
  "insight": "<1-2 warm, specific sentences that acknowledge what they shared and offer a gentle, actionable reflection>"
}

Journal entry:
"${text.slice(0, 800)}"`

  try {
    const raw = await callGemini([{ role: 'user', parts: [{ text: prompt }] }])
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned) as EmotionAnalysisResult

    const valid = ['happy', 'sad', 'anxious', 'calm', 'excited', 'tired', 'stressed', 'neutral']
    if (!valid.includes(parsed.emotion)) parsed.emotion = 'neutral' as Emotion
    parsed.confidence = Math.max(45, Math.min(95, Number(parsed.confidence) || 70))
    if (!parsed.insight || typeof parsed.insight !== 'string') {
      parsed.insight = getInsightForEmotion(parsed.emotion as Emotion)
    }

    return parsed
  } catch {
    // Fallback to local keyword analysis
    return analyzeEmotion(text)
  }
}

export async function getQuickInsightFromGemini(emotion: Emotion): Promise<string> {
  const prompt = `Write a warm, supportive 1-2 sentence insight for someone who just logged feeling "${emotion}" in their mood journal. Be specific to this emotion, empathetic, and avoid generic filler. Speak directly to them.`

  try {
    return (await callGemini([{ role: 'user', parts: [{ text: prompt }] }])).trim()
  } catch {
    return getInsightForEmotion(emotion)
  }
}

// ── Chatbot ───────────────────────────────────────────────────────────────────

const CHAT_SYSTEM = `You are "The Digital Breath" — a warm, empathetic emotional intelligence companion inside the Serenity Lab wellness app.

Your approach:
- Listen with genuine compassion before offering advice
- Reflect feelings back accurately ("It sounds like you're feeling...")
- Ask ONE thoughtful follow-up question per response
- Keep responses warm and concise (2-4 sentences)
- Be specific and personal — avoid generic platitudes
- Never diagnose conditions or give medical advice
- If someone seems in serious distress or mentions self-harm, gently suggest professional support (e.g. a therapist or crisis line)

Tone: like a caring, wise friend who understands psychology.`

export async function getChatResponseFromGemini(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<string> {
  const contents: GContent[] = [
    ...history.map(m => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.content }] as [{ text: string }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  try {
    return (await callGemini(contents, CHAT_SYSTEM)).trim()
  } catch {
    return getChatbotResponse(userMessage)
  }
}

// ── Summary Narrative ─────────────────────────────────────────────────────────

export async function generateNarrativeWithGemini(
  entries: MoodEntry[],
  period: 'daily' | 'weekly' | 'monthly'
): Promise<string> {
  if (entries.length === 0) return 'No entries recorded for this period.'

  const stats = generateSummaryFromEntries(entries)

  const entriesText = entries
    .slice(-12)
    .map(e =>
      `- ${new Date(e.created_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric' })}: ${e.emotion} (${e.confidence}%) — "${e.entry_text.slice(0, 100)}"`
    )
    .join('\n')

  const prompt = `You are a compassionate wellness coach writing a ${period} mood summary for a user in the Serenity Lab app.

Stats:
- ${entries.length} entries
- Dominant emotion: ${stats.dominant_emotion} (${stats.emotion_distribution[stats.dominant_emotion]}% of entries)
- Average confidence: ${stats.average_confidence}%
- Trend: ${stats.trend}

Recent entries:
${entriesText}

Write a warm, personal 2-3 sentence narrative that:
1. Acknowledges the emotional pattern you see, citing specifics
2. Offers one meaningful observation about the trend
3. Ends with a specific, actionable encouragement tailored to their dominant emotion

Write ONLY the narrative — no labels, no bullet points, no headers.`

  try {
    return (await callGemini([{ role: 'user', parts: [{ text: prompt }] }])).trim()
  } catch {
    return stats.narrative
  }
}

// ── Chat Session Summary ──────────────────────────────────────────────────────

export async function generateChatSessionSummaryWithGemini(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ summary: string; dominant_emotion: string }> {
  const userMessages = messages.filter(m => m.role === 'user')
  if (userMessages.length === 0) {
    return { summary: 'No messages in this session.', dominant_emotion: 'neutral' }
  }

  const transcript = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  const prompt = `Analyze this emotional support chat session and respond with ONLY a raw JSON object — no markdown, no code fences.

{
  "dominant_emotion": "<exactly one of: happy, sad, anxious, calm, excited, tired, stressed, neutral>",
  "summary": "<2-3 sentence summary of the session: what the user shared, the emotional themes, and the support offered>"
}

Chat transcript:
${transcript.slice(0, 2000)}`

  try {
    const raw = await callGemini([{ role: 'user', parts: [{ text: prompt }] }])
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    // Fallback: basic analysis
    const { analyzeEmotion } = await import('./emotion-analysis')
    const combined = userMessages.map(m => m.content).join(' ')
    const result = analyzeEmotion(combined)
    return {
      dominant_emotion: result.emotion,
      summary: `Chat session with ${userMessages.length} message${userMessages.length !== 1 ? 's' : ''}. Dominant emotion: ${result.emotion}.`,
    }
  }
}
