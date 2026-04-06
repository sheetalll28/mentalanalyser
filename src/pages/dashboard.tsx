import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  TrendingUp as TrendingUpIcon,
  Sparkles as SparklesIcon,
  Flame as FlameIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  getTodayEntries, getWeekEntries, getMonthEntries,
  getEntriesForMonth, getStreak, getRecentFactors,
  type LocalMoodEntry, type LocalDailyFactor,
} from '@/lib/storage'

const emotionColors: Record<string, string> = {
  happy: 'hsl(43 96% 56%)', sad: 'hsl(217 91% 60%)', anxious: 'hsl(28 80% 52%)',
  calm: 'hsl(173 58% 39%)', excited: 'hsl(330 81% 60%)', tired: 'hsl(215 16% 47%)',
  stressed: 'hsl(0 72% 51%)', neutral: 'hsl(240 4% 46%)',
}

const emotionCalendarColor: Record<string, string> = {
  happy: '#fbbf24', sad: '#60a5fa', anxious: '#fb923c', calm: '#2dd4bf',
  excited: '#f472b6', tired: '#94a3b8', stressed: '#f87171', neutral: '#a1a1aa',
}

const emotionEmojis: Record<string, string> = {
  happy: '😊', sad: '😢', anxious: '😰', calm: '😌',
  excited: '🤩', tired: '😴', stressed: '😫', neutral: '😐',
}

// ── Mood Calendar ─────────────────────────────────────────────────────────────

function MoodCalendar() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [entries, setEntries] = useState<LocalMoodEntry[]>([])

  useEffect(() => {
    setEntries(getEntriesForMonth(viewYear, viewMonth))
  }, [viewYear, viewMonth])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Dominant emotion per day
  const dominantByDay = new Map<number, string>()
  const countByDay = new Map<number, number>()
  const emotionCountsByDay = new Map<number, Record<string, number>>()

  entries.forEach(e => {
    const day = new Date(e.created_at).getDate()
    if (!emotionCountsByDay.has(day)) emotionCountsByDay.set(day, {})
    const counts = emotionCountsByDay.get(day)!
    counts[e.emotion] = (counts[e.emotion] || 0) + 1
    countByDay.set(day, (countByDay.get(day) || 0) + 1)
  })

  emotionCountsByDay.forEach((counts, day) => {
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    dominantByDay.set(day, dominant)
  })

  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const uniqueEmotions = Array.from(new Set(dominantByDay.values()))

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="size-4" /></Button>
        <p className="font-semibold">{monthLabel}</p>
        <Button variant="ghost" size="icon" onClick={nextMonth} disabled={viewYear === today.getFullYear() && viewMonth === today.getMonth()}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="py-1 text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const emotion = dominantByDay.get(day)
          const count = countByDay.get(day) || 0
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
          const bgColor = emotion ? emotionCalendarColor[emotion] + '55' : undefined

          return (
            <div
              key={i}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-all ${isToday ? 'ring-2 ring-primary' : ''}`}
              style={bgColor ? { backgroundColor: bgColor } : undefined}
              title={emotion && count ? `${count} entr${count > 1 ? 'ies' : 'y'} — ${emotion}` : undefined}
            >
              <span className={`font-medium leading-none ${isToday ? 'text-primary' : emotion ? '' : 'text-muted-foreground'}`}>{day}</span>
              {emotion && <span className="mt-0.5 text-[10px] leading-none">{emotionEmojis[emotion]}</span>}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      {uniqueEmotions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {uniqueEmotions.map(emotion => (
            <div key={emotion} className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="size-2.5 rounded-sm" style={{ backgroundColor: emotionCalendarColor[emotion] }} />
              <span className="capitalize">{emotion}</span>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">No entries this month.</p>
      )}
    </div>
  )
}

// ── Period stats panel ────────────────────────────────────────────────────────

interface PeriodStats {
  entries: LocalMoodEntry[]
  chartData: Array<{ date: string; score: number }>
  emotionDistribution: Array<{ emotion: string; count: number }>
  latestEntry: LocalMoodEntry | null
}

function buildStats(entries: LocalMoodEntry[], groupBy: 'hour' | 'day'): PeriodStats {
  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null
  const grouped = new Map<string, number[]>()
  entries.forEach(e => {
    const d = new Date(e.created_at)
    const label = groupBy === 'hour'
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!grouped.has(label)) grouped.set(label, [])
    grouped.get(label)!.push(e.confidence)
  })
  const chartData = Array.from(grouped.entries()).map(([date, scores]) => ({
    date, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }))
  const emotionMap = new Map<string, number>()
  entries.forEach(e => emotionMap.set(e.emotion, (emotionMap.get(e.emotion) || 0) + 1))
  const emotionDistribution = Array.from(emotionMap.entries())
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count).slice(0, 5)
  return { entries, chartData, emotionDistribution, latestEntry }
}

const chartConfig = { score: { label: 'Confidence', color: 'var(--primary)' } }

function StatsView({ stats, groupBy }: { stats: PeriodStats; groupBy: 'hour' | 'day' }) {
  if (stats.entries.length === 0) {
    return <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">No entries yet. Start tracking your mood!</div>
  }

  const avgConfidence = Math.round(stats.entries.reduce((sum, e) => sum + e.confidence, 0) / stats.entries.length)
  const mostCommon = stats.emotionDistribution[0]
  const totalDist = stats.emotionDistribution.reduce((a, b) => a + b.count, 0)

  return (
    <div className="space-y-5">
      {stats.latestEntry && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUpIcon className="size-4 text-primary" />Most Recent Mood</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{emotionEmojis[stats.latestEntry.emotion]}</span>
                <div>
                  <p className="font-semibold capitalize">{stats.latestEntry.emotion}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(stats.latestEntry.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">{stats.latestEntry.confidence}%</p>
                <p className="text-xs text-muted-foreground">Confidence</p>
              </div>
            </div>
            <Progress value={stats.latestEntry.confidence} className="h-2" />
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm leading-relaxed text-muted-foreground">{stats.latestEntry.insight}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Mood Trend</CardTitle><p className="text-xs text-muted-foreground">Confidence scores over time</p></CardHeader>
          <CardContent>
            {stats.chartData.length > 1 ? (
              <ChartContainer config={chartConfig} className="h-52 w-full">
                <LineChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11}
                    angle={groupBy === 'day' ? -35 : 0} textAnchor={groupBy === 'day' ? 'end' : 'middle'}
                    height={groupBy === 'day' ? 48 : 24} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex h-52 items-center justify-center text-xs text-muted-foreground">Need more entries for trend</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Emotion Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex h-36 items-center justify-center">
                <PieChart width={144} height={144}>
                  <Pie data={stats.emotionDistribution} dataKey="count" nameKey="emotion" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={2}>
                    {stats.emotionDistribution.map(entry => (
                      <Cell key={entry.emotion} fill={emotionColors[entry.emotion] || 'hsl(240 4% 46%)'} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              <div className="space-y-1.5">
                {stats.emotionDistribution.map(item => (
                  <div key={item.emotion} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full" style={{ backgroundColor: emotionColors[item.emotion] }} />
                      <span className="capitalize">{item.emotion}</span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">{Math.round((item.count / totalDist) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Entries</p><p className="text-2xl font-bold tabular-nums">{stats.entries.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Avg Confidence</p><p className="text-2xl font-bold tabular-nums">{avgConfidence}%</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Top Mood</p><p className="text-xl font-bold capitalize">{mostCommon?.emotion ?? '—'}</p></CardContent></Card>
      </div>

      {mostCommon && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"><SparklesIcon className="size-5 text-primary" /></div>
              <div>
                <p className="text-sm font-medium">Most Common Mood</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  You've been feeling <span className="font-medium capitalize text-foreground">{mostCommon.emotion}</span> most often ({Math.round((mostCommon.count / totalDist) * 100)}% of entries).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Insights Section ──────────────────────────────────────────────────────────

function avg(arr: number[]) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
}

function InsightsSection({ entries, factors }: { entries: LocalMoodEntry[]; factors: LocalDailyFactor[] }) {
  if (entries.length < 5) return null

  // Time of day buckets
  const buckets: Record<string, { label: string; emoji: string; scores: number[] }> = {
    morning:   { label: 'Morning',   emoji: '🌅', scores: [] },
    afternoon: { label: 'Afternoon', emoji: '☀️', scores: [] },
    evening:   { label: 'Evening',   emoji: '🌆', scores: [] },
    night:     { label: 'Night',     emoji: '🌙', scores: [] },
  }

  entries.forEach(e => {
    const h = new Date(e.created_at).getHours()
    if (h >= 5 && h < 12)  buckets.morning.scores.push(e.confidence)
    else if (h >= 12 && h < 17) buckets.afternoon.scores.push(e.confidence)
    else if (h >= 17 && h < 21) buckets.evening.scores.push(e.confidence)
    else                         buckets.night.scores.push(e.confidence)
  })

  const timeStats = Object.values(buckets)
    .map(b => ({ ...b, avg: avg(b.scores), count: b.scores.length }))
    .filter(b => b.count > 0)
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))

  const bestTime = timeStats[0]
  const worstTime = timeStats[timeStats.length - 1]

  // Correlation with factors
  const exerciseDates = new Set(factors.filter(f => f.exercise).map(f => f.date))
  const noExerciseDates = new Set(factors.filter(f => !f.exercise).map(f => f.date))
  const goodSleepDates = new Set(factors.filter(f => f.sleep_hours >= 7).map(f => f.date))
  const poorSleepDates = new Set(factors.filter(f => f.sleep_hours < 7).map(f => f.date))

  const scoreOn = (dates: Set<string>) =>
    avg(entries.filter(e => dates.has(new Date(e.created_at).toISOString().split('T')[0])).map(e => e.confidence))

  const exWith = scoreOn(exerciseDates)
  const exWithout = scoreOn(noExerciseDates)
  const sleepGood = scoreOn(goodSleepDates)
  const sleepPoor = scoreOn(poorSleepDates)

  const hasCorrelation = factors.length >= 3 && (exWith !== null || sleepGood !== null)

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Insights</h2>

      {/* Time of day */}
      {timeStats.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <SparklesIcon className="size-4 text-primary" />
              Best Time of Day
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {bestTime && (
                <div className="rounded-lg bg-green-500/10 p-3 text-center">
                  <p className="text-xl">{bestTime.emoji}</p>
                  <p className="text-sm font-semibold">{bestTime.label}</p>
                  <p className="text-xs text-muted-foreground">{bestTime.avg}% avg mood</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Best</p>
                </div>
              )}
              {worstTime && worstTime.label !== bestTime?.label && (
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xl">{worstTime.emoji}</p>
                  <p className="text-sm font-semibold">{worstTime.label}</p>
                  <p className="text-xs text-muted-foreground">{worstTime.avg}% avg mood</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Lowest</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              {timeStats.map(t => (
                <div key={t.label} className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-muted-foreground">{t.emoji} {t.label}</span>
                  <div className="flex-1 rounded-full bg-muted h-2">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${t.avg}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums text-muted-foreground">{t.avg}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correlation */}
      {hasCorrelation && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <SparklesIcon className="size-4 text-primary" />
              Mood vs. Daily Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exWith !== null && exWithout !== null && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Exercise</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-muted-foreground">With 🏃</span>
                  <div className="flex-1 rounded-full bg-muted h-2">
                    <div className="h-2 rounded-full bg-green-500" style={{ width: `${exWith}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums">{exWith}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-muted-foreground">Without 🛋️</span>
                  <div className="flex-1 rounded-full bg-muted h-2">
                    <div className="h-2 rounded-full bg-muted-foreground/50" style={{ width: `${exWithout}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums">{exWithout}%</span>
                </div>
                {exWith > exWithout + 3 && <p className="text-[11px] text-green-600 dark:text-green-400">You feel better on days you exercise.</p>}
              </div>
            )}
            {sleepGood !== null && sleepPoor !== null && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Sleep</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-muted-foreground">7h+ 😴</span>
                  <div className="flex-1 rounded-full bg-muted h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${sleepGood}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums">{sleepGood}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-muted-foreground">Under 7h 😵</span>
                  <div className="flex-1 rounded-full bg-muted h-2">
                    <div className="h-2 rounded-full bg-muted-foreground/50" style={{ width: `${sleepPoor}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums">{sleepPoor}%</span>
                </div>
                {sleepGood > sleepPoor + 3 && <p className="text-[11px] text-blue-600 dark:text-blue-400">Good sleep noticeably lifts your mood.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const [dailyStats, setDailyStats] = useState<PeriodStats | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<PeriodStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<PeriodStats | null>(null)
  const [streak, setStreak] = useState(0)
  const [allEntries, setAllEntries] = useState<LocalMoodEntry[]>([])
  const [factors, setFactors] = useState<LocalDailyFactor[]>([])

  useEffect(() => {
    const month = getMonthEntries()
    setDailyStats(buildStats(getTodayEntries(), 'hour'))
    setWeeklyStats(buildStats(getWeekEntries(), 'day'))
    setMonthlyStats(buildStats(month, 'day'))
    setStreak(getStreak())
    setAllEntries(month)
    setFactors(getRecentFactors(30))
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">Mood Dashboard</h1>
          <p className="text-sm text-muted-foreground">Understand your emotional landscape</p>
        </div>
        {streak > 0 && (
          <div className="flex flex-col items-center rounded-xl border bg-card px-4 py-2 shadow-sm">
            <div className="flex items-center gap-1 text-orange-500">
              <FlameIcon className="size-5" />
              <span className="text-2xl font-bold tabular-nums">{streak}</span>
            </div>
            <p className="text-xs text-muted-foreground">day streak</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="daily">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          {dailyStats && <StatsView stats={dailyStats} groupBy="hour" />}
        </TabsContent>
        <TabsContent value="weekly" className="mt-4">
          {weeklyStats && <StatsView stats={weeklyStats} groupBy="day" />}
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          {monthlyStats && <StatsView stats={monthlyStats} groupBy="day" />}
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <Card><CardContent className="pt-5"><MoodCalendar /></CardContent></Card>
        </TabsContent>
      </Tabs>

      <InsightsSection entries={allEntries} factors={factors} />
    </div>
  )
}
