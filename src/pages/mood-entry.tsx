import { useState, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles as SparklesIcon, Brain as BrainIcon, Scan as ScanIcon, Mic, Square, RefreshCw, RotateCcw } from 'lucide-react'
import { analyzeEmotion, getInsightForEmotion, type EmotionAnalysisResult, type Emotion } from '@/lib/emotion-analysis'
import { addMoodEntry } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Constants ─────────────────────────────────────────────────────────────────

const emotionColors: Record<string, string> = {
  happy: 'text-amber-600 dark:text-amber-500',
  sad: 'text-blue-600 dark:text-blue-400',
  anxious: 'text-orange-600 dark:text-orange-500',
  calm: 'text-teal-600 dark:text-teal-500',
  excited: 'text-pink-600 dark:text-pink-500',
  tired: 'text-slate-600 dark:text-slate-400',
  stressed: 'text-red-600 dark:text-red-500',
  neutral: 'text-muted-foreground',
}

const emotionEmojis: Record<string, string> = {
  happy: '😊', sad: '😢', anxious: '😰', calm: '😌',
  excited: '🤩', tired: '😴', stressed: '😫', neutral: '😐',
}

const EMOTIONS: Emotion[] = ['happy', 'calm', 'excited', 'neutral', 'anxious', 'tired', 'stressed', 'sad']

const DAILY_PROMPTS = [
  'What made you smile today?',
  "What's weighing on your mind right now?",
  'How would you describe your energy today?',
  'What are you looking forward to?',
  'What challenged you today?',
  'How are you taking care of yourself today?',
  'What emotion keeps coming up for you?',
  'What do you need more of right now?',
  'Describe your day in one feeling.',
  "What's something you're grateful for today?",
  'What situation is affecting your mood most?',
  'How did your sleep affect you today?',
  'What would make today feel better?',
  'Is there something on your mind you have not said out loud?',
]

// ── Component ─────────────────────────────────────────────────────────────────

export function MoodEntry() {
  const [entryText, setEntryText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [result, setResult] = useState<EmotionAnalysisResult | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [promptIndex, setPromptIndex] = useState(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000)
    return dayOfYear % DAILY_PROMPTS.length
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<number | null>(null)

  const analysisSteps = [
    { icon: ScanIcon, text: 'Reading your entry...' },
    { icon: BrainIcon, text: 'Analyzing emotional patterns...' },
    { icon: SparklesIcon, text: 'Generating insights...' },
  ]

  const wordCount = entryText.trim().split(/\s+/).filter(Boolean).length
  const tooShort = wordCount > 0 && wordCount < 5

  // ── Speech recognition setup ──────────────────────────────────────────────

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' '
      }
      if (finalTranscript) setEntryText(prev => prev + finalTranscript)
    }

    recognitionRef.current.onerror = (event: any) => {
      if (event.error !== 'no-speech') toast.error('Speech recognition error: ' + event.error)
      stopRecording()
    }

    recognitionRef.current.onend = () => {
      if (isRecording) { try { recognitionRef.current?.start() } catch { } }
    }

    return () => {
      recognitionRef.current?.stop()
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    }
  }, [isRecording])

  // ── Recording ─────────────────────────────────────────────────────────────

  const startRecording = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported. Please use Chrome or Edge.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsRecording(true)
      setRecordingTime(0)
      audioChunksRef.current = []
      recordingIntervalRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000)
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mediaRecorderRef.current.start()
      recognitionRef.current?.start()
      toast.success('Recording started. Speak now!')
    } catch {
      toast.error('Failed to access microphone. Please grant permission.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null }
    recognitionRef.current?.stop()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
    }
    toast.success('Recording stopped')
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // ── Analysis ──────────────────────────────────────────────────────────────

  const runAnalysis = async (text: string, overrideEmotion?: Emotion) => {
    setIsAnalyzing(true)
    setResult(null)
    setAnalysisStep(0)

    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStep(i)
      await new Promise(r => setTimeout(r, overrideEmotion ? 300 : 600))
    }

    const analysisResult: EmotionAnalysisResult = overrideEmotion
      ? { emotion: overrideEmotion, confidence: 78 + Math.floor(Math.random() * 15), insight: getInsightForEmotion(overrideEmotion) }
      : analyzeEmotion(text)

    addMoodEntry({
      id: crypto.randomUUID(),
      entry_text: text,
      emotion: analysisResult.emotion,
      confidence: analysisResult.confidence,
      insight: analysisResult.insight,
      created_at: new Date().toISOString(),
    })

    await new Promise(r => setTimeout(r, 300))
    setResult(analysisResult)
    setIsAnalyzing(false)
  }

  const handleAnalyze = () => { if (entryText.trim()) runAnalysis(entryText) }

  const handleQuickLog = (emotion: Emotion) => {
    const text = `Quick log: feeling ${emotion}.`
    setEntryText(text)
    runAnalysis(text, emotion)
  }

  const handleLogAgain = () => {
    setResult(null)
    setEntryText('')
  }

  const cyclePrompt = () => setPromptIndex(i => (i + 1) % DAILY_PROMPTS.length)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-24">
      {/* Header */}
      <div className="space-y-1 text-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">Serenity Lab</h1>
        <p className="text-lg text-muted-foreground">Your Emotional Intelligence Companion</p>
      </div>

      {/* Daily Prompt */}
      <Card className="border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium text-primary">Today's Prompt</p>
              <p className="mt-0.5 text-sm text-foreground">{DAILY_PROMPTS[promptIndex]}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={cyclePrompt} title="New prompt">
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </Card>

      {/* Input Card */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="mood-entry" className="text-sm font-medium">How are you feeling today?</label>
            <p className="text-xs text-muted-foreground">Type your thoughts, use your voice, or tap an emotion below.</p>
          </div>

          <Textarea
            id="mood-entry"
            placeholder="I'm feeling..."
            value={entryText}
            onChange={e => setEntryText(e.target.value)}
            className="min-h-28 resize-none text-base"
            disabled={isAnalyzing || isRecording}
          />

          {/* Word count warning */}
          {tooShort && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-950/30">
              <span className="text-amber-600 dark:text-amber-400 text-xs">
                A few more words help us understand your mood better. ({wordCount}/5 words)
              </span>
            </div>
          )}

          {/* Quick-tap emotions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Or tap your mood directly:</p>
            <div className="grid grid-cols-4 gap-2">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion}
                  onClick={() => handleQuickLog(emotion)}
                  disabled={isAnalyzing || isRecording}
                  className="flex flex-col items-center gap-1 rounded-lg border bg-background p-2 text-center transition-colors hover:border-primary hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="text-2xl">{emotionEmojis[emotion]}</span>
                  <span className="text-xs capitalize text-muted-foreground">{emotion}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice controls */}
          {!isRecording ? (
            <Button onClick={startRecording} disabled={isAnalyzing} variant="outline" className="w-full" size="lg">
              <Mic className="mr-2 h-4 w-4" />
              Start Voice Input
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="w-full" size="lg">
              <Square className="mr-2 h-4 w-4 fill-current" />
              Stop Recording ({formatTime(recordingTime)})
            </Button>
          )}

          {isRecording && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950/20">
              <div className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="h-3 w-1 animate-pulse rounded-full bg-red-500" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">Listening...</span>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={!entryText.trim() || isAnalyzing || isRecording}
            className="w-full"
            size="lg"
          >
            {isAnalyzing
              ? <span className="flex items-center gap-2"><SparklesIcon className="size-4 animate-pulse" />Analyzing...</span>
              : 'Analyze My Mood'
            }
          </Button>
        </div>
      </Card>

      {/* Analysis Steps */}
      {isAnalyzing && (
        <Card className="p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <SparklesIcon className="size-4 animate-pulse text-primary" />
              Processing...
            </div>
            {analysisSteps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === analysisStep
              const isComplete = index < analysisStep
              return (
                <div key={index} className={cn('flex items-center gap-3 rounded-lg border p-3 transition-all', isActive && 'border-primary bg-primary/5', isComplete && 'opacity-50')}>
                  <Icon className={cn('size-5', isActive && 'animate-pulse text-primary', isComplete && 'text-muted-foreground')} />
                  <span className={cn('text-sm', isActive && 'font-medium')}>{step.text}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Result */}
      {result && !isAnalyzing && (
        <Card className="p-5">
          <div className="space-y-5">
            <div className="text-center">
              <div className="mb-2 text-6xl">{emotionEmojis[result.emotion]}</div>
              <h3 className="mb-1 text-2xl font-semibold">
                <span className={cn('capitalize', emotionColors[result.emotion])}>{result.emotion}</span>
              </h3>
              <p className="text-sm text-muted-foreground">Detected emotion</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Confidence</span>
                <span className="tabular-nums text-muted-foreground">{result.confidence}%</span>
              </div>
              <Progress value={result.confidence} className="h-2" />
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <SparklesIcon className="size-4 text-primary" />
                Insight
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.insight}</p>
            </div>

            {/* Log again */}
            <Button variant="outline" className="w-full" onClick={handleLogAgain}>
              <RotateCcw className="mr-2 size-4" />
              Log Another Entry
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
