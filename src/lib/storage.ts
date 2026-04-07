export type MoodEntry = {
  id: string
  entry_text: string
  emotion: string
  confidence: number
  insight: string
  created_at: string
}

const KEYS = {
  MOOD_ENTRIES: 'serenity_mood_entries',
  CHAT_SESSIONS: 'serenity_chat_sessions',
  DAILY_FACTORS: 'serenity_daily_factors',
}

export type LocalMoodEntry = MoodEntry

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type ChatSession = {
  id: string
  messages: ChatMessage[]
  summary: string | null
  dominant_emotion: string | null
  created_at: string
  ended_at: string | null
}

export type LocalDailyFactor = {
  id: string
  date: string
  sleep_hours: number
  caffeine_intake: number
  exercise: boolean
  insight: string
  saved_at: string
}

function readJSON<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function writeJSON<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// ── Mood Entries ──────────────────────────────────────────────────────────────

export function getMoodEntries(): LocalMoodEntry[] {
  return readJSON<LocalMoodEntry>(KEYS.MOOD_ENTRIES)
}

export function addMoodEntry(entry: LocalMoodEntry): void {
  const entries = getMoodEntries()
  entries.push(entry)
  writeJSON(KEYS.MOOD_ENTRIES, entries)
}

export function deleteMoodEntry(id: string): void {
  writeJSON(KEYS.MOOD_ENTRIES, getMoodEntries().filter(e => e.id !== id))
}

export function getEntriesInRange(start: Date, end: Date): LocalMoodEntry[] {
  return getMoodEntries().filter(e => {
    const d = new Date(e.created_at)
    return d >= start && d <= end
  })
}

export function getTodayEntries(): LocalMoodEntry[] {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end = new Date(); end.setHours(23, 59, 59, 999)
  return getEntriesInRange(start, end)
}

export function getWeekEntries(): LocalMoodEntry[] {
  const start = new Date(); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0)
  return getEntriesInRange(start, new Date())
}

export function getMonthEntries(): LocalMoodEntry[] {
  const start = new Date(); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0)
  return getEntriesInRange(start, new Date())
}

export function getEntriesForMonth(year: number, month: number): LocalMoodEntry[] {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return getEntriesInRange(start, end)
}

export function getStreak(): number {
  const entries = getMoodEntries()
  if (entries.length === 0) return 0

  const datesWithEntries = new Set(
    entries.map(e => new Date(e.created_at).toISOString().split('T')[0])
  )

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const cursor = new Date(today)
  if (!datesWithEntries.has(todayStr)) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (true) {
    const dateStr = cursor.toISOString().split('T')[0]
    if (datesWithEntries.has(dateStr)) { streak++; cursor.setDate(cursor.getDate() - 1) }
    else break
  }
  return streak
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export function isOnboarded(): boolean {
  return localStorage.getItem('serenity_onboarded') === 'true'
}

export function setOnboarded(): void {
  localStorage.setItem('serenity_onboarded', 'true')
}

// ── Daily Factors ─────────────────────────────────────────────────────────────

export function getDailyFactors(): LocalDailyFactor[] {
  return readJSON<LocalDailyFactor>(KEYS.DAILY_FACTORS)
}

export function saveDailyFactor(factor: LocalDailyFactor): void {
  const factors = getDailyFactors()
  const idx = factors.findIndex(f => f.date === factor.date)
  if (idx >= 0) factors[idx] = factor; else factors.push(factor)
  writeJSON(KEYS.DAILY_FACTORS, factors)
}

export function getTodayFactor(): LocalDailyFactor | null {
  const today = new Date().toISOString().split('T')[0]
  return getDailyFactors().find(f => f.date === today) ?? null
}

export function getRecentFactors(days: number): LocalDailyFactor[] {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days); cutoff.setHours(0, 0, 0, 0)
  return getDailyFactors()
    .filter(f => new Date(f.date) >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date))
}

// ── Chat Sessions ─────────────────────────────────────────────────────────────

export function getChatSessions(): ChatSession[] {
  return readJSON<ChatSession>(KEYS.CHAT_SESSIONS)
}

export function saveChatSession(session: ChatSession): void {
  const sessions = getChatSessions()
  const idx = sessions.findIndex(s => s.id === session.id)
  if (idx >= 0) sessions[idx] = session; else sessions.push(session)
  writeJSON(KEYS.CHAT_SESSIONS, sessions)
}

export function getEndedChatSessions(): ChatSession[] {
  return getChatSessions()
    .filter(s => s.ended_at !== null)
    .sort((a, b) => new Date(b.ended_at!).getTime() - new Date(a.ended_at!).getTime())
}
