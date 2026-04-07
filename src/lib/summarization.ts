import type { MoodEntry } from './storage'

interface SummaryData {
  dominant_emotion: string
  emotion_distribution: Record<string, number>
  trend: string
  narrative: string
  insights: string[]
  entry_count: number
  average_confidence: number
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
