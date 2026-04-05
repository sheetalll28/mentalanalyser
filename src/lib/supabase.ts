import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type MoodEntry = {
  id: string
  user_id: string
  entry_text: string
  emotion: string
  confidence: number
  insight: string
  created_at: string
}

export type ChatMessage = {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type DailyFactor = {
  id: string
  user_id: string
  date: string
  sleep_hours: number
  caffeine_intake: number
  exercise: boolean
  insight: string | null
  created_at: string
}

export type Summary = {
  id: string
  user_id: string
  summary_type: 'daily' | 'weekly' | 'monthly'
  summary_date: string
  dominant_emotion: string | null
  emotion_distribution: Record<string, number> | null
  trend: string | null
  narrative: string | null
  insights: string[] | null
  entry_count: number
  average_confidence: number | null
  created_at: string
  updated_at: string
}
