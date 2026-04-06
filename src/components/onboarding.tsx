import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { setOnboarded } from '@/lib/storage'
import { PenTool, Activity, BarChart2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

const STEPS = [
  {
    icon: PenTool,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    title: 'Track Your Mood',
    description:
      'Write how you feel, use your voice, or tap an emotion for a quick check-in. Our AI analyses your entry and gives you a personalised insight.',
  },
  {
    icon: Activity,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    title: 'Log Daily Factors',
    description:
      'Record your sleep, caffeine, and exercise each day. Over time you\'ll see exactly how these habits shape your emotional state.',
  },
  {
    icon: BarChart2,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    title: 'Discover Your Patterns',
    description:
      'The Dashboard and Summary tabs turn your entries into charts, streaks, a mood calendar, and correlation insights — all stored privately on your device.',
  },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  const finish = () => {
    setOnboarded()
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border bg-card shadow-xl">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-4 px-8 py-8 text-center">
          <div className={`flex size-16 items-center justify-center rounded-2xl ${current.color}`}>
            <Icon className="size-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{current.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{current.description}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
              Skip
            </Button>
          )}

          {isLast ? (
            <Button onClick={finish} size="sm">
              <Sparkles className="mr-1.5 size-4" />
              Get Started
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep(s => s + 1)}>
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
