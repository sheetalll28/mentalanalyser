export type Emotion = 'happy' | 'sad' | 'anxious' | 'calm' | 'excited' | 'tired' | 'stressed' | 'neutral'

export interface EmotionAnalysisResult {
  emotion: Emotion
  confidence: number
  insight: string
}

const emotionKeywords: Record<Emotion, string[]> = {
  happy: ['happy', 'joy', 'joyful', 'great', 'wonderful', 'amazing', 'fantastic', 'excellent', 'good', 'glad', 'cheerful', 'pleased', 'content', 'delighted'],
  sad: ['sad', 'down', 'depressed', 'unhappy', 'miserable', 'gloomy', 'melancholy', 'sorrowful', 'blue', 'crying', 'tears', 'heartbroken'],
  anxious: ['anxious', 'worried', 'nervous', 'stress', 'stressed', 'tense', 'uneasy', 'restless', 'panicked', 'overwhelmed', 'pressure'],
  calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'quiet', 'still', 'composed', 'centered', 'balanced'],
  excited: ['excited', 'thrilled', 'enthusiastic', 'energized', 'eager', 'pumped', 'hyped', 'animated', 'exhilarated'],
  tired: ['tired', 'exhausted', 'fatigued', 'weary', 'drained', 'sleepy', 'worn out', 'burned out', 'sluggish'],
  stressed: ['stressed', 'pressure', 'overwhelmed', 'burden', 'strain', 'tense', 'frazzled', 'overworked'],
  neutral: ['okay', 'fine', 'alright', 'normal', 'average', 'regular', 'typical', 'ordinary']
}

const emotionInsights: Record<Emotion, string[]> = {
  happy: [
    'Your positive energy is shining through! Keep nurturing what brings you joy.',
    'It\'s wonderful to see you feeling so uplifted. Savor these moments of happiness.',
    'Your optimistic outlook is a strength. Continue cultivating these positive feelings.',
    'Happiness looks good on you! Consider what\'s working well to maintain this mood.'
  ],
  sad: [
    'It\'s okay to feel sad. These emotions are valid and temporary. Be gentle with yourself.',
    'Remember that sadness is a natural part of the human experience. You\'re not alone.',
    'Allow yourself to feel these emotions without judgment. Better days are ahead.',
    'Your feelings matter. Consider reaching out to someone you trust or engaging in self-care.'
  ],
  anxious: [
    'Anxiety can feel overwhelming, but you\'re taking the right step by acknowledging it.',
    'Try some deep breathing exercises or a brief walk to help calm your nervous system.',
    'Remember: most worries never come to pass. Focus on what you can control right now.',
    'Consider breaking down overwhelming tasks into smaller, manageable steps.'
  ],
  calm: [
    'Your sense of peace is valuable. Take note of what helped you achieve this tranquility.',
    'This calm state is your natural equilibrium. You\'re doing great at maintaining balance.',
    'Savor this peaceful moment. It\'s a testament to your emotional regulation skills.',
    'Your centered state of mind is supporting your overall wellbeing beautifully.'
  ],
  excited: [
    'Your enthusiasm is contagious! Channel this energy toward your goals and passions.',
    'Excitement is a powerful motivator. Ride this wave while staying grounded.',
    'This positive energy can fuel great things. What will you create with it?',
    'Your vibrant energy is wonderful. Remember to balance excitement with rest when needed.'
  ],
  tired: [
    'Your body and mind are signaling a need for rest. Honor that message.',
    'Fatigue is your body\'s way of asking for care. Prioritize sleep and restoration.',
    'Consider what might be draining your energy and how to create more space for rest.',
    'Rest is productive. Give yourself permission to slow down and recharge.'
  ],
  stressed: [
    'Stress is a signal to pause and reassess. What can you release or delegate?',
    'You\'re carrying a lot right now. It\'s okay to set boundaries and ask for support.',
    'Try the 5-5-5 rule: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
    'Consider which stressors are within your control and focus your energy there.'
  ],
  neutral: [
    'A neutral mood is perfectly okay. Not every day needs to be extraordinary.',
    'You\'re in a steady state. This baseline feeling is part of your emotional landscape.',
    'Neutral doesn\'t mean bad. It\'s a calm between the waves of more intense emotions.',
    'This balanced state can be a good time for reflection and planning.'
  ]
}

export function analyzeEmotion(text: string): EmotionAnalysisResult {
  const lowerText = text.toLowerCase()
  const emotionScores: Record<Emotion, number> = {
    happy: 0,
    sad: 0,
    anxious: 0,
    calm: 0,
    excited: 0,
    tired: 0,
    stressed: 0,
    neutral: 0
  }

  // Count keyword matches for each emotion
  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        emotionScores[emotion as Emotion] += 1
      }
    })
  })

  // Find the emotion with highest score
  let dominantEmotion: Emotion = 'neutral'
  let highestScore = 0

  Object.entries(emotionScores).forEach(([emotion, score]) => {
    if (score > highestScore) {
      highestScore = score
      dominantEmotion = emotion as Emotion
    }
  })

  // Calculate confidence based on keyword matches (more matches = higher confidence)
  const baseConfidence = highestScore > 0 ? 60 : 40
  const confidenceBoost = Math.min(highestScore * 8, 35)
  const randomVariation = Math.floor(Math.random() * 10) - 5
  const confidence = Math.max(45, Math.min(95, baseConfidence + confidenceBoost + randomVariation))

  // Select a random insight for the detected emotion
  const insights = emotionInsights[dominantEmotion]
  const insight = insights[Math.floor(Math.random() * insights.length)]

  return {
    emotion: dominantEmotion,
    confidence,
    insight
  }
}

export function getChatbotResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase()

  // Sad/down responses
  if (lowerMessage.match(/sad|down|depressed|unhappy|miserable|blue|crying/)) {
    const responses = [
      'I hear that you\'re feeling down. It\'s completely okay to feel this way. Would you like to talk about what\'s on your mind?',
      'I\'m sorry you\'re feeling sad. Remember, these feelings are temporary. Is there something specific that\'s troubling you?',
      'Your feelings are valid. Sometimes just acknowledging sadness is the first step toward healing. What would help you feel better right now?',
      'I understand you\'re going through a tough time. Would it help to explore what\'s contributing to these feelings?'
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Happy/positive responses
  if (lowerMessage.match(/happy|great|wonderful|amazing|fantastic|good|joy|excellent/)) {
    const responses = [
      'That\'s wonderful to hear! What\'s bringing you such joy today?',
      'Your positive energy is amazing! Would you like to share what\'s making you feel so good?',
      'I love hearing that you\'re feeling happy! Savoring these positive moments can help you build resilience.',
      'That\'s fantastic! Taking time to appreciate these good feelings can amplify them.'
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Anxious/worried responses
  if (lowerMessage.match(/anxious|worried|nervous|stress|panic|overwhelmed|scared|fear/)) {
    const responses = [
      'Anxiety can feel really challenging. Let\'s take a moment together. Try taking a slow, deep breath. What\'s weighing on your mind?',
      'I understand that feeling overwhelmed can be difficult. Would it help to break down what\'s worrying you into smaller parts?',
      'It sounds like you\'re carrying a heavy load. Remember: you don\'t have to handle everything at once. What feels most pressing right now?',
      'Anxiety often makes things feel bigger than they are. Let\'s ground ourselves. Can you name three things you can see around you right now?'
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Tired/exhausted responses
  if (lowerMessage.match(/tired|exhausted|fatigued|drained|sleepy|worn out/)) {
    const responses = [
      'It sounds like your body is asking for rest. Have you been able to get enough sleep lately?',
      'Fatigue is a signal from your body. What\'s been keeping you from getting the rest you need?',
      'Being tired affects everything. Is there a way you could prioritize rest today?',
      'Your body needs recharging. Even a short break can help. What would feel most restorative to you?'
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Grateful/thankful responses
  if (lowerMessage.match(/grateful|thankful|thank|appreciate|blessed|fortunate/)) {
    const responses = [
      'Gratitude is such a powerful practice! What are you feeling thankful for?',
      'That\'s beautiful. Recognizing what we\'re grateful for can shift our whole perspective.',
      'I love that you\'re taking time to appreciate the good in your life. This mindset serves you well.',
      'Gratitude is like sunshine for the soul. Keep nurturing this positive outlook!'
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Default/general responses
  const defaultResponses = [
    'I\'m here to listen. Tell me more about what you\'re experiencing.',
    'Thank you for sharing that with me. How are you feeling about it?',
    'I appreciate you opening up. What else is on your mind?',
    'That\'s interesting. Would you like to explore those feelings more deeply?',
    'I understand. What would be most helpful for you right now?',
    'Tell me more. I\'m here to support you through whatever you\'re feeling.'
  ]

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}

export function generateDailyFactorInsight(
  sleepHours: number,
  caffeineIntake: number,
  exercise: boolean
): string {
  const insights: string[] = []

  if (sleepHours < 6) {
    insights.push('Low sleep (under 6 hours) is strongly correlated with increased anxiety and stress. Prioritizing 7-9 hours may improve your mood significantly.')
  } else if (sleepHours >= 8) {
    insights.push('Great sleep! Getting 8+ hours supports emotional regulation and resilience.')
  }

  if (caffeineIntake > 3) {
    insights.push('High caffeine intake (4+ servings) can amplify anxiety and disrupt sleep quality. Consider moderating consumption after 2 PM.')
  } else if (caffeineIntake === 0) {
    insights.push('Zero caffeine can support better sleep and reduced anxiety for many people.')
  }

  if (exercise) {
    insights.push('Exercise is one of the most effective mood boosters! It reduces stress hormones and releases endorphins.')
  } else {
    insights.push('Regular physical activity, even a 10-minute walk, can significantly improve mood and reduce stress.')
  }

  // Combination insights
  if (sleepHours < 6 && caffeineIntake > 2) {
    insights.push('The combination of low sleep and high caffeine can create a challenging cycle. Focus on sleep first.')
  }

  if (sleepHours >= 7 && exercise && caffeineIntake <= 2) {
    insights.push('Your lifestyle factors are well-balanced! This combination strongly supports emotional wellbeing.')
  }

  return insights.length > 0
    ? insights[Math.floor(Math.random() * insights.length)]
    : 'Your daily habits play a significant role in your emotional health. Keep tracking to identify patterns!'
}
