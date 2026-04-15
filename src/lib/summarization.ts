import type { MoodEntry, LocalDailyFactor } from './storage'

export type TherapyType = 'cognitive-behavioral' | 'mindfulness' | 'psychodynamic' | 'interpersonal' | 'supportive' | 'none'

export interface TherapyRecommendation {
  recommended: boolean
  severity: 'low' | 'moderate' | 'high' | 'none'
  types: TherapyType[]
  reasons: string[]
}

export interface WellbeingData {
  sleepQuality: number
  moodScore: number
  activityLevel: number
  wellbeingIndex: number
  therapyRecommendation: TherapyRecommendation
}

interface SummaryData {
  dominant_emotion: string
  emotion_distribution: Record<string, number>
  trend: string
  narrative: string
  insights: string[]
  entry_count: number
  average_confidence: number
  wellbeing?: WellbeingData
}

export function generateSummaryFromEntries(entries: MoodEntry[]): SummaryData {
  if (entries.length === 0) {
    return {
      dominant_emotion: 'neutral',
      emotion_distribution: { neutral: 100 },
      trend: 'stable',
      narrative: 'No entries recorded for this period.',
      insights: [],
      entry_count: 0,
      average_confidence: 0,
    }
  }

  const emotionCounts: Record<string, number> = {}
  let totalConfidence = 0

  entries.forEach((entry) => {
    emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1
    totalConfidence += entry.confidence
  })

  const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

  const emotionDistribution: Record<string, number> = {}
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    emotionDistribution[emotion] = Math.round((count / entries.length) * 100)
  })

  const midpoint = Math.floor(entries.length / 2)
  const firstHalf = entries.slice(0, midpoint)
  const secondHalf = entries.slice(midpoint)
  const positiveEmotions = ['happy', 'excited', 'calm']
  const firstHalfPositive = firstHalf.filter((e) => positiveEmotions.includes(e.emotion)).length
  const secondHalfPositive = secondHalf.filter((e) => positiveEmotions.includes(e.emotion)).length

  let trend = 'stable'
  if (secondHalfPositive > firstHalfPositive + 1) trend = 'improving'
  else if (secondHalfPositive < firstHalfPositive - 1) trend = 'declining'

  const avgConfidence = Math.round(totalConfidence / entries.length)
  let narrative = `Over this period, you recorded ${entries.length} mood entries. `

  if (entries.length === 1) {
    narrative += `You felt ${dominantEmotion} with ${avgConfidence}% confidence.`
  } else {
    narrative += `Your dominant emotion was ${dominantEmotion}, appearing in ${emotionDistribution[dominantEmotion]}% of entries. `
    if (trend === 'improving') narrative += 'Your emotional state showed positive improvement over time. '
    else if (trend === 'declining') narrative += 'You may have experienced some challenging moments recently. '
    else narrative += 'Your emotional state remained relatively stable. '

    const varietyCount = Object.keys(emotionCounts).length
    if (varietyCount > 4) narrative += 'You experienced a wide range of emotions, showing emotional complexity.'
    else if (varietyCount === 1) narrative += 'Your emotions were quite consistent throughout this period.'
  }

  const insights: string[] = []
  if (emotionDistribution[dominantEmotion] > 60)
    insights.push(`${dominantEmotion} was your predominant emotion, accounting for over 60% of entries`)
  if (trend === 'improving') insights.push('Positive trend detected — your mood improved over the period')
  else if (trend === 'declining') insights.push('Consider reaching out for support if you continue to feel down')
  if ((emotionDistribution['anxious'] || 0) > 20 || (emotionDistribution['stressed'] || 0) > 20)
    insights.push('Elevated anxiety or stress levels detected — consider relaxation techniques')
  if ((emotionDistribution['sad'] || 0) > 30)
    insights.push('Significant sadness detected — it may help to talk to someone you trust')
  if (avgConfidence > 80)
    insights.push('High confidence in emotion detection — your entries were very expressive')

  return {
    dominant_emotion: dominantEmotion,
    emotion_distribution: emotionDistribution,
    trend,
    narrative,
    insights,
    entry_count: entries.length,
    average_confidence: avgConfidence,
  }
}

// ── Wellbeing Index & Therapy Recommendations ──────────────────────────────────

export function calculateMoodScore(entries: MoodEntry[]): number {
  if (entries.length === 0) return 50

  const emotionScores: Record<string, number> = {
    happy: 95, grateful: 90, hopeful: 85, excited: 90, calm: 80,
    neutral: 50, okay: 55, fine: 50,
    tired: 40, lonely: 35, frustrated: 45, anxious: 30, stressed: 25,
    sad: 20, angry: 15, overwhelmed: 10,
  }

  const totalScore = entries.reduce((sum, entry) => {
    return sum + (emotionScores[entry.emotion] || 50)
  }, 0)

  return Math.round(totalScore / entries.length)
}

export function calculateSleepQuality(factors: LocalDailyFactor[]): number {
  if (factors.length === 0) return 50

  const avgSleep = factors.reduce((sum, f) => sum + f.sleep_hours, 0) / factors.length
  // Optimal sleep is 7-9 hours, score decreases as it deviates
  let score = 100 - Math.abs(avgSleep - 8) * 10
  score = Math.max(0, Math.min(100, score))
  return Math.round(score)
}

export function calculateActivityLevel(factors: LocalDailyFactor[]): number {
  if (factors.length === 0) return 50

  const exerciseDays = factors.filter(f => f.exercise).length
  const activityPercentage = (exerciseDays / factors.length) * 100
  return Math.round(activityPercentage)
}

export function generateTherapyRecommendation(
  moodScore: number,
  sleepQuality: number,
  activityLevel: number,
  trend: string,
  emotionDistribution: Record<string, number>
): TherapyRecommendation {
  const reasons: string[] = []
  const types: TherapyType[] = []
  let severity: 'low' | 'moderate' | 'high' | 'none' = 'none'
  let recommended = false

  // Check for concerning emotions
  const stressLevel = (emotionDistribution['stressed'] || 0) + (emotionDistribution['anxious'] || 0)
  const sadnessLevel = emotionDistribution['sad'] || 0
  const overwhelmLevel = emotionDistribution['overwhelmed'] || 0

  // High stress and anxiety - recommend mindfulness or cognitive-behavioral
  if (stressLevel > 30) {
    recommended = true
    severity = stressLevel > 50 ? 'high' : 'moderate'
    types.push('mindfulness')
    types.push('cognitive-behavioral')
    reasons.push(`Elevated stress and anxiety detected (${stressLevel}% of emotions)`)
  }

  // Significant sadness - recommend supportive or psychodynamic therapy
  if (sadnessLevel > 25) {
    recommended = true
    if (severity === 'none') severity = sadnessLevel > 40 ? 'high' : 'moderate'
    if (!types.includes('supportive')) types.push('supportive')
    if (!types.includes('psychodynamic')) types.push('psychodynamic')
    reasons.push(`Significant sadness detected (${sadnessLevel}% of emotions)`)
  }

  // Feeling overwhelmed - recommend intensive support
  if (overwhelmLevel > 20) {
    recommended = true
    severity = 'high'
    if (!types.includes('supportive')) types.push('supportive')
    reasons.push('Feelings of being overwhelmed detected — consider professional support')
  }

  // Poor sleep quality - affects mental health
  if (sleepQuality < 40) {
    if (!recommended) {
      recommended = true
      severity = 'moderate'
    }
    if (!types.includes('cognitive-behavioral')) types.push('cognitive-behavioral')
    reasons.push('Poor sleep quality detected (may be affecting mood and wellbeing)')
  }

  // Low activity level - affects mood
  if (activityLevel < 30) {
    if (!recommended) {
      recommended = true
      severity = 'low'
    }
    reasons.push('Low physical activity level detected (exercise can improve mental health)')
  }

  // Declining trend - warrants attention
  if (trend === 'declining') {
    if (!recommended) {
      recommended = true
      severity = 'moderate'
    }
    if (!types.includes('supportive')) types.push('supportive')
    reasons.push('Your emotional state is showing a declining trend')
  }

  // Interpersonal therapy for relationship/isolation issues
  if ((emotionDistribution['lonely'] || 0) > 20) {
    if (!types.includes('interpersonal')) types.push('interpersonal')
    reasons.push('Feelings of loneliness detected — interpersonal therapy could help')
  }

  // Remove duplicates and limit to top 3 recommendations
  const uniqueTypes = Array.from(new Set(types)) as TherapyType[]
  const limitedTypes = uniqueTypes.slice(0, 3)

  // If no specific issues but overall score is low, recommend general supportive therapy
  if (!recommended && moodScore < 40) {
    recommended = true
    severity = 'low'
    limitedTypes.push('supportive')
    reasons.push('Overall wellbeing score is below optimal range')
  }

  return {
    recommended,
    severity,
    types: limitedTypes,
    reasons,
  }
}

export function calculateWellbeingIndex(
  entries: MoodEntry[],
  factors: LocalDailyFactor[],
  trend: string,
  emotionDistribution: Record<string, number>
): WellbeingData {
  const moodScore = calculateMoodScore(entries)
  const sleepQuality = calculateSleepQuality(factors)
  const activityLevel = calculateActivityLevel(factors)

  // Wellbeing index is average of three components (each 0-100)
  const wellbeingIndex = Math.round((moodScore + sleepQuality + activityLevel) / 3)

  const therapyRecommendation = generateTherapyRecommendation(
    moodScore,
    sleepQuality,
    activityLevel,
    trend,
    emotionDistribution
  )

  return {
    sleepQuality,
    moodScore,
    activityLevel,
    wellbeingIndex,
    therapyRecommendation,
  }
}
