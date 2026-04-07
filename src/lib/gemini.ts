import { analyzeEmotion, getChatbotResponse, getInsightForEmotion, type Emotion, type EmotionAnalysisResult } from './emotion-analysis'
import type { MoodEntry } from './storage'
import { generateSummaryFromEntries } from './summarization'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL = 'gemini-2.0-flash-lite'
const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

type GContent = { role: 'user' | 'model'; parts: [{ text: string }] }

async function callGemini(
  contents: GContent[],
  systemInstruction?: string,
  temperature = 0.4,
  retries = 3,
): Promise<string> {
  if (!API_KEY) throw new Error('No Gemini API key configured')

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature, maxOutputTokens: 512 },
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(`${BASE}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.status === 429) {
      // Rate limited — wait then retry
      const wait = 1500 * (attempt + 1)
      await new Promise(r => setTimeout(r, wait))
      continue
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Gemini ${res.status}: ${err?.error?.message ?? res.statusText}`)
    }

    const data = await res.json()
    return data.candidates[0].content.parts[0].text as string
  }

  throw new Error('Gemini rate limit: too many requests')
}

// ── Emotion Analysis ──────────────────────────────────────────────────────────

export async function analyzeEmotionWithGemini(text: string): Promise<EmotionAnalysisResult> {
  const prompt = `You are an expert in emotional intelligence and cognitive-behavioral psychology. Read this mood journal entry and identify the single dominant emotion.

## Emotion definitions — pick the most precise match:
- happy: genuine positivity, things going well, pleasure
- excited: high energy anticipation, enthusiasm for something upcoming
- grateful: appreciation for what exists, feeling fortunate
- hopeful: forward-looking optimism, belief things will improve
- calm: stillness, peace, low-tension equilibrium
- neutral: flat, nothing notable, just getting through
- tired: low energy, physical/mental fatigue, need for rest
- lonely: disconnected, unseen, craving real connection
- sad: loss, grief, disappointment, withdrawal, low mood
- anxious: future-focused worry, "what if" dread, nervous tension
- frustrated: effort not paying off, blocked, stuck, things not working
- stressed: external demands piling up, deadlines, workload pressure
- overwhelmed: capacity exceeded — too much to cope with at once
- angry: hot reactive feeling, directed at person or situation, sense of injustice

## Critical rules:
- Negation changes meaning completely. "Not good" is NOT good. "Don't feel happy" is NOT happy.
- Implied emotion counts. "A friend betrayed me" implies angry + hurt even if neither word appears.
- When emotions mix, pick the one that has the most energy behind it right now.
- Short vague entries get lower confidence (45–60). Clear detailed entries get higher (75–95).
- The insight MUST reference specific words or details from their entry — not generic advice for the emotion category.

## Examples of tricky cases:
Entry: "not good, a friend kind a betrayed me" → angry (betrayal triggers hot reactive feeling; hurt is underneath it)
Entry: "I'm fine I guess, just don't want to do anything" → tired or sad (denial + withdrawal signal)
Entry: "everything is just too much right now I can't even think" → overwhelmed (capacity collapse, not just stress)
Entry: "I'm worried about my interview tomorrow" → anxious (future-specific, not stress)
Entry: "finished the project, feel kind of empty now" → neutral or sad (post-achievement flatness)

Return ONLY a raw JSON object — no markdown, no code fences, no explanation:

{
  "emotion": "<one of: happy, sad, anxious, calm, excited, tired, stressed, neutral, angry, frustrated, grateful, hopeful, lonely, overwhelmed>",
  "confidence": <integer 45–95>,
  "insight": "<2 sentences grounded in their specific words: sentence 1 names what they're actually experiencing with precision, sentence 2 offers one concrete next step tailored to this emotion and situation>"
}

Journal entry:
"${text.slice(0, 1200)}"`

  try {
    const raw = await callGemini([{ role: 'user', parts: [{ text: prompt }] }], undefined, 0.2)
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned) as EmotionAnalysisResult

    const valid: Emotion[] = ['happy', 'sad', 'anxious', 'calm', 'excited', 'tired', 'stressed', 'neutral', 'angry', 'frustrated', 'grateful', 'hopeful', 'lonely', 'overwhelmed']
    if (!valid.includes(parsed.emotion)) parsed.emotion = 'neutral' as Emotion
    parsed.confidence = Math.max(45, Math.min(95, Number(parsed.confidence) || 70))
    if (!parsed.insight || typeof parsed.insight !== 'string') {
      parsed.insight = getInsightForEmotion(parsed.emotion as Emotion)
    }

    return parsed
  } catch {
    return analyzeEmotion(text)
  }
}

export async function getQuickInsightFromGemini(emotion: Emotion): Promise<string> {
  const prompt = `Someone just tapped "${emotion}" as their quick mood log in a wellness app. Write exactly 2 sentences:
1. A specific acknowledgment of what this emotion actually feels like in the body or mind (not generic)
2. One small, concrete action they can take in the next 10 minutes that is genuinely suited to this emotion

Tone: warm, direct, never preachy. No filler phrases like "it's okay to feel" or "remember that". Speak in second person.`

  try {
    return (await callGemini([{ role: 'user', parts: [{ text: prompt }] }], undefined, 0.7)).trim()
  } catch {
    return getInsightForEmotion(emotion)
  }
}

// ── Chatbot ───────────────────────────────────────────────────────────────────

const CHAT_SYSTEM = `You are "The Digital Breath" — an emotionally intelligent companion inside the Serenity Lab wellness app. You are NOT a therapist, but you respond the way a wise, caring friend with a strong psychology background would.

Rules you ALWAYS follow:
1. Read the emotional subtext, not just the surface words. Someone saying "I'm fine" after describing something hard is not fine.
2. Reflect the specific feeling you hear — name it precisely. Don't say "it sounds hard." Say "it sounds like you're carrying a quiet frustration that nobody's noticing."
3. Ask exactly ONE follow-up question per response. Make it open-ended and specific to what they shared — not a generic "how does that make you feel?"
4. Keep responses to 3-5 sentences total. No walls of text.
5. Validate before you advise. Never jump straight to "have you tried..." without first acknowledging their experience.
6. Match their energy. If they're being casual, be warm but light. If they're in pain, drop the lightness entirely.
7. Never use these phrases: "I understand", "that must be hard", "it's okay to feel", "you've got this", "remember that".
8. Distinguish between similar emotions in your reflection: stressed ≠ anxious ≠ overwhelmed ≠ frustrated ≠ angry. Use the right word.
9. If someone mentions self-harm, crisis, or suicidal thoughts — respond with genuine warmth and gently but clearly suggest a crisis line or professional support.
10. Never diagnose. Never prescribe. Never moralize.

Tone: direct, warm, genuinely curious about this specific person.`

export async function getChatResponseFromGemini(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<string> {
  // Gemini requires the first message in contents to be from 'user'.
  // Drop leading assistant messages (e.g. the welcome message) before building contents.
  const trimmed = [...history]
  while (trimmed.length > 0 && trimmed[0].role === 'assistant') trimmed.shift()

  const contents: GContent[] = [
    ...trimmed.map(m => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.content }] as [{ text: string }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  try {
    return (await callGemini(contents, CHAT_SYSTEM, 0.85)).trim()
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

  const prompt = `You are a perceptive wellness coach writing a ${period} emotional summary for a user in the Serenity Lab app. You have real psychological depth — you look beneath the surface patterns, not just the obvious ones.

Data:
- ${entries.length} entries recorded
- Dominant emotion: ${stats.dominant_emotion} (${stats.emotion_distribution[stats.dominant_emotion] ?? '?'}% of entries)
- Average confidence: ${stats.average_confidence}%
- Trend: ${stats.trend}

Recent entries (most recent last):
${entriesText}

Write a 3-sentence narrative:
1. Name the emotional pattern you genuinely observe — be specific, not generic. Reference actual emotions from the data.
2. Offer one non-obvious insight about what might be driving this pattern or what it says about the person's current life.
3. End with one concrete, actionable suggestion — not a platitude — tailored to their dominant emotion and trend.

Constraints: No bullet points. No headers. No phrases like "it seems like" or "it looks like." Write with quiet confidence. No more than 80 words total.`

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
  "dominant_emotion": "<exactly one of: happy, sad, anxious, calm, excited, tired, stressed, neutral, angry, frustrated, grateful, hopeful, lonely, overwhelmed>",
  "summary": "<3 sentences: (1) what the user was dealing with or feeling, using their specific words/situation, (2) the emotional arc or shift across the conversation if any, (3) one forward-looking observation or encouragement grounded in what was shared>"
}

Emotion guide — pick the most accurate one:
- angry: hot, reactive feelings directed at something/someone
- frustrated: blocked effort, things not working
- overwhelmed: too much to handle at once
- anxious: worry about future, "what if" thinking
- lonely: craving connection, feeling unseen

Chat transcript:
${transcript.slice(0, 3000)}`

  try {
    const raw = await callGemini([{ role: 'user', parts: [{ text: prompt }] }], undefined, 0.3)
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
