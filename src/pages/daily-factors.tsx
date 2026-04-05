import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Moon as MoonIcon, Coffee as CoffeeIcon, Activity as ActivityIcon, Sparkles as SparklesIcon, CircleCheck as CheckCircleIcon } from 'lucide-react'
import { generateDailyFactorInsight } from '@/lib/emotion-analysis'
import { saveDailyFactor, getTodayFactor } from '@/lib/storage'
import { toast } from 'sonner'

export function DailyFactors() {
  const [sleepHours, setSleepHours] = useState([7])
  const [caffeineIntake, setCaffeineIntake] = useState([1])
  const [exercise, setExercise] = useState(false)
  const [insight, setInsight] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alreadyLogged, setAlreadyLogged] = useState(false)

  useEffect(() => {
    const existing = getTodayFactor()
    if (existing) {
      setSleepHours([existing.sleep_hours])
      setCaffeineIntake([existing.caffeine_intake])
      setExercise(existing.exercise)
      setInsight(existing.insight)
      setAlreadyLogged(true)
    }
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)

    const generatedInsight = generateDailyFactorInsight(sleepHours[0], caffeineIntake[0], exercise)
    setInsight(generatedInsight)

    const today = new Date().toISOString().split('T')[0]
    saveDailyFactor({
      id: today,
      date: today,
      sleep_hours: sleepHours[0],
      caffeine_intake: caffeineIntake[0],
      exercise,
      insight: generatedInsight,
      saved_at: new Date().toISOString(),
    })

    setAlreadyLogged(true)
    toast.success('Daily log saved!')
    setIsSubmitting(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24">
      <div className="space-y-2">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">Daily Factors</h1>
        <p className="text-sm text-muted-foreground">Track the lifestyle factors that influence your mood</p>
      </div>

      {alreadyLogged && !insight && (
        <Alert>
          <CheckCircleIcon className="size-4" />
          <AlertTitle>Already logged today</AlertTitle>
          <AlertDescription>You can update your entry by adjusting the values below.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Wellness Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Sleep */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <MoonIcon className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <Label className="text-base font-medium">Sleep Hours</Label>
                <p className="text-sm text-muted-foreground">How many hours did you sleep last night?</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">{sleepHours[0]}</p>
                <p className="text-xs text-muted-foreground">hours</p>
              </div>
            </div>
            <Slider value={sleepHours} onValueChange={setSleepHours} min={0} max={12} step={0.5} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0h</span><span>6h</span><span>12h</span>
            </div>
          </div>

          {/* Caffeine */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <CoffeeIcon className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <Label className="text-base font-medium">Caffeine Intake</Label>
                <p className="text-sm text-muted-foreground">Cups of coffee, tea, or energy drinks</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">{caffeineIntake[0]}</p>
                <p className="text-xs text-muted-foreground">servings</p>
              </div>
            </div>
            <Slider value={caffeineIntake} onValueChange={setCaffeineIntake} min={0} max={8} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span><span>4</span><span>8+</span>
            </div>
          </div>

          {/* Exercise */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                <ActivityIcon className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <Label className="text-base font-medium">Exercise Today</Label>
                <p className="text-sm text-muted-foreground">Did you exercise for 10+ minutes?</p>
              </div>
            </div>
            <Switch checked={exercise} onCheckedChange={setExercise} />
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <SparklesIcon className="size-4 animate-pulse" />
                Saving...
              </span>
            ) : alreadyLogged ? 'Update Daily Log' : 'Save Daily Log'}
          </Button>
        </CardContent>
      </Card>

      {insight && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <SparklesIcon className="size-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Lifestyle Insight</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{insight}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm">
            <p className="font-medium">Why track these factors?</p>
            <ul className="ml-4 space-y-2 text-muted-foreground">
              <li className="list-disc"><strong>Sleep:</strong> 7–9 hours supports emotional regulation and reduces anxiety</li>
              <li className="list-disc"><strong>Caffeine:</strong> Can amplify stress and disrupt sleep when consumed in excess</li>
              <li className="list-disc"><strong>Exercise:</strong> Natural mood booster that releases endorphins and reduces stress</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
