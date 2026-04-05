import { useState, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles as SparklesIcon, Brain as BrainIcon, Scan as ScanIcon, Mic, Square } from 'lucide-react'
import { analyzeEmotion, type EmotionAnalysisResult } from '@/lib/emotion-analysis'
import { addMoodEntry } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  calm: '😌',
  excited: '🤩',
  tired: '😴',
  stressed: '😫',
  neutral: '😐',
}

export function MoodEntry() {
  const [entryText, setEntryText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [result, setResult] = useState<EmotionAnalysisResult | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingIntervalRef = useRef<number | null>(null)

  const analysisSteps = [
    { icon: ScanIcon, text: 'Reading your entry...' },
    { icon: BrainIcon, text: 'Analyzing emotional patterns...' },
    { icon: SparklesIcon, text: 'Generating insights...' },
  ]

  useEffect(() => {
    // Initialize Web Speech API for speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setEntryText((prev) => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error !== 'no-speech') {
          toast.error('Speech recognition error: ' + event.error)
        }
        stopRecording()
      }

      recognitionRef.current.onend = () => {
        if (isRecording) {
          // Restart if still recording (continuous mode)
          try {
            recognitionRef.current?.start()
          } catch (e) {
            // Ignore if already started
          }
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      // Check for browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        toast.error('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
        return
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Start speech recognition
      setIsRecording(true)
      setRecordingTime(0)
      audioChunksRef.current = []

      // Start recording timer
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Setup media recorder for audio capture (optional - for future server-side processing)
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      mediaRecorderRef.current.start()

      // Start speech-to-text
      recognitionRef.current?.start()
      toast.success('Recording started. Speak now!')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to access microphone. Please grant permission.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }

    toast.success('Recording stopped')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnalyze = async () => {
    if (!entryText.trim()) return

    setIsAnalyzing(true)
    setResult(null)
    setAnalysisStep(0)

    // Simulate analysis steps with delays
    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStep(i)
      await new Promise(resolve => setTimeout(resolve, 600))
    }

    // Perform analysis
    const analysisResult = analyzeEmotion(entryText)

    // Save to localStorage
    addMoodEntry({
      id: crypto.randomUUID(),
      entry_text: entryText,
      emotion: analysisResult.emotion,
      confidence: analysisResult.confidence,
      insight: analysisResult.insight,
      created_at: new Date().toISOString(),
    })

    await new Promise(resolve => setTimeout(resolve, 400))
    setResult(analysisResult)
    setIsAnalyzing(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          Serenity Lab
        </h1>
        <p className="text-lg text-muted-foreground">
          Your Emotional Intelligence Companion
        </p>
      </div>

      {/* Input Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="mood-entry" className="text-sm font-medium">
              How are you feeling today?
            </label>
            <p className="text-xs text-muted-foreground">
              Share your thoughts and emotions by typing or using your voice.
            </p>
          </div>

          <Textarea
            id="mood-entry"
            placeholder="I'm feeling..."
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            className="min-h-32 resize-none text-base"
            disabled={isAnalyzing || isRecording}
          />

          {/* Voice Recording Controls */}
          <div className="flex gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isAnalyzing}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Mic className="mr-2 h-4 w-4" />
                Start Voice Input
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <Square className="mr-2 h-4 w-4 fill-current" />
                Stop Recording ({formatTime(recordingTime)})
              </Button>
            )}
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-3">
              <div className="flex gap-1">
                <div className="h-3 w-1 animate-pulse rounded-full bg-red-500" style={{ animationDelay: '0ms' }} />
                <div className="h-3 w-1 animate-pulse rounded-full bg-red-500" style={{ animationDelay: '150ms' }} />
                <div className="h-3 w-1 animate-pulse rounded-full bg-red-500" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Listening...
              </span>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={!entryText.trim() || isAnalyzing || isRecording}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <SparklesIcon className="size-4 animate-pulse" />
                Analyzing...
              </span>
            ) : (
              'Analyze My Mood'
            )}
          </Button>
        </div>
      </Card>

      {/* Analysis Steps */}
      {isAnalyzing && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <SparklesIcon className="size-4 animate-pulse text-primary" />
              Processing...
            </div>

            <div className="space-y-3">
              {analysisSteps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === analysisStep
                const isComplete = index < analysisStep

                return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 transition-all',
                      isActive && 'border-primary bg-primary/5',
                      isComplete && 'opacity-50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-5',
                        isActive && 'animate-pulse text-primary',
                        isComplete && 'text-muted-foreground'
                      )}
                    />
                    <span className={cn('text-sm', isActive && 'font-medium')}>
                      {step.text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <Card className="p-6">
          <div className="space-y-6">
            {/* Emotion */}
            <div className="text-center">
              <div className="mb-2 text-6xl">
                {emotionEmojis[result.emotion]}
              </div>
              <h3 className="mb-1 text-2xl font-semibold">
                <span className={cn('capitalize', emotionColors[result.emotion])}>
                  {result.emotion}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground">
                Detected emotion
              </p>
            </div>

            {/* Confidence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Confidence</span>
                <span className="tabular-nums text-muted-foreground">
                  {result.confidence}%
                </span>
              </div>
              <Progress value={result.confidence} className="h-2" />
            </div>

            {/* Insight */}
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <SparklesIcon className="size-4 text-primary" />
                Insight
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {result.insight}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
