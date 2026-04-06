import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  FileText as FileTextIcon, TrendingUp as TrendingUpIcon, CircleAlert as AlertCircleIcon,
  Sparkles as SparklesIcon, MessageSquare as MessageSquareIcon,
  Moon as MoonIcon, Coffee as CoffeeIcon, Activity as ActivityIcon, Trash2 as TrashIcon,
} from 'lucide-react'
import {
  getTodayEntries, getWeekEntries, getMonthEntries, getEndedChatSessions,
  getTodayFactor, getRecentFactors, deleteMoodEntry,
  type LocalMoodEntry, type ChatSession, type LocalDailyFactor,
} from '@/lib/storage'
import { generateSummaryFromEntries } from '@/lib/summarization'
import { generateNarrativeWithGemini } from '@/lib/gemini'
import { Skeleton } from '@/components/ui/skeleton'

const emotionEmojis: Record<string, string> = {
  happy: '😊', sad: '😢', anxious: '😰', calm: '😌',
  excited: '🤩', tired: '😴', stressed: '😫', neutral: '😐',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <TrendingUpIcon className="size-4 text-green-600 dark:text-green-400" />
  if (trend === 'declining') return <AlertCircleIcon className="size-4 text-orange-600 dark:text-orange-400" />
  return <FileTextIcon className="size-4 text-blue-600 dark:text-blue-400" />
}

function TrendBadge({ trend }: { trend: string }) {
  if (trend === 'improving') return <span className="text-green-600 dark:text-green-400 font-medium">Improving</span>
  if (trend === 'declining') return <span className="text-orange-600 dark:text-orange-400 font-medium">Needs Attention</span>
  return <span className="text-blue-600 dark:text-blue-400 font-medium">Stable</span>
}

// ── Daily Factor Card ─────────────────────────────────────────────────────────

function DailyFactorCard({ factor }: { factor: LocalDailyFactor | null }) {
  if (!factor) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <ActivityIcon className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No daily factors logged yet. Go to the Factors tab to log them.</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ActivityIcon className="size-4 text-primary" />
          Daily Log
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {new Date(factor.saved_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 p-3">
            <MoonIcon className="size-4 text-blue-600 dark:text-blue-400" />
            <div><p className="text-xs text-muted-foreground">Sleep</p><p className="font-semibold">{factor.sleep_hours}h</p></div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3">
            <CoffeeIcon className="size-4 text-amber-600 dark:text-amber-400" />
            <div><p className="text-xs text-muted-foreground">Caffeine</p><p className="font-semibold">{factor.caffeine_intake}</p></div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3">
            <ActivityIcon className="size-4 text-green-600 dark:text-green-400" />
            <div><p className="text-xs text-muted-foreground">Exercise</p><p className="font-semibold">{factor.exercise ? 'Yes' : 'No'}</p></div>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex gap-2">
            <SparklesIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">{factor.insight}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Factors History Table ─────────────────────────────────────────────────────

function FactorsHistoryPanel({ factors }: { factors: LocalDailyFactor[] }) {
  if (factors.length === 0) return null
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ActivityIcon className="size-4 text-primary" />
          Wellness Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {factors.map(f => (
            <div key={f.date} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <div className="w-16 shrink-0 text-xs text-muted-foreground">
                {new Date(f.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex flex-1 gap-3">
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <MoonIcon className="size-3.5" /><span className="text-xs">{f.sleep_hours}h</span>
                </div>
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <CoffeeIcon className="size-3.5" /><span className="text-xs">{f.caffeine_intake}</span>
                </div>
                <div className={`flex items-center gap-1 ${f.exercise ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  <ActivityIcon className="size-3.5" /><span className="text-xs">{f.exercise ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const ALL_EMOTIONS = ['happy', 'calm', 'excited', 'neutral', 'anxious', 'tired', 'stressed', 'sad']

// ── Summary Panel ─────────────────────────────────────────────────────────────

function SummaryPanel({ entries, label, onDeleted }: { entries: LocalMoodEntry[]; label: string; onDeleted: () => void }) {
  const [filterEmotion, setFilterEmotion] = useState('all')
  const [aiNarrative, setAiNarrative] = useState<string | null>(null)
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const prevEntriesKey = useRef('')

  const filtered = useMemo(() =>
    filterEmotion === 'all' ? entries : entries.filter(e => e.emotion === filterEmotion),
    [entries, filterEmotion]
  )

  useEffect(() => {
    if (entries.length === 0) return
    const key = entries.map(e => e.id).join(',')
    if (key === prevEntriesKey.current) return
    prevEntriesKey.current = key

    setNarrativeLoading(true)
    setAiNarrative(null)
    const period = label === 'Day' ? 'daily' : label === 'Week' ? 'weekly' : 'monthly'
    generateNarrativeWithGemini(entries as any, period)
      .then(n => { setAiNarrative(n); setNarrativeLoading(false) })
      .catch(() => setNarrativeLoading(false))
  }, [entries, label])

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <FileTextIcon className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No Data Yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Track your mood to see your {label} summary.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const summary = generateSummaryFromEntries(entries)

  const handleDelete = (id: string) => {
    deleteMoodEntry(id)
    onDeleted()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Entries</p><p className="text-2xl font-bold tabular-nums">{summary.entry_count}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Avg Confidence</p><p className="text-2xl font-bold tabular-nums">{summary.average_confidence}%</p></CardContent></Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Trend</p>
            <div className="mt-0.5 flex items-center gap-1"><TrendIcon trend={summary.trend} /><TrendBadge trend={summary.trend} /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <SparklesIcon className="size-4 text-primary" />
            {label} in Perspective
            {narrativeLoading && <span className="ml-auto text-xs font-normal text-muted-foreground animate-pulse">AI generating…</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {narrativeLoading
            ? <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /></div>
            : <p className="text-sm leading-relaxed text-muted-foreground">{aiNarrative || summary.narrative}</p>
          }
        </CardContent>
      </Card>

      {summary.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Insights</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 text-primary">•</span>{insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Emotion Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.emotion_distribution).sort((a, b) => b[1] - a[1]).map(([emotion, pct]) => (
              <Badge key={emotion} variant="secondary" className="gap-1.5 px-3 py-1">
                <span className="text-base">{emotionEmojis[emotion] ?? '💬'}</span>
                <span className="capitalize">{emotion}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Entries</CardTitle>
            <select
              value={filterEmotion}
              onChange={e => setFilterEmotion(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="all">All emotions</option>
              {ALL_EMOTIONS.map(em => (
                <option key={em} value={em}>{emotionEmojis[em]} {em}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No entries match this filter.</p>
          ) : (
          <div className="space-y-2">
            {filtered.slice().reverse().slice(0, 10).map(entry => (
              <div key={entry.id} className="flex items-start gap-3 rounded-lg border p-3">
                <span className="text-xl">{emotionEmojis[entry.emotion]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium capitalize">{entry.emotion}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">{entry.entry_text}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground hover:text-destructive">
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                      <AlertDialogDescription>This mood entry will be permanently removed. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Chat Sessions Panel ───────────────────────────────────────────────────────

function ChatSessionsPanel({ sessions }: { sessions: ChatSession[] }) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <MessageSquareIcon className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No Chat Sessions Yet</p>
            <p className="mt-1 text-sm text-muted-foreground">End a chat session to see its summary here.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map(session => {
        const userMsgCount = session.messages.filter(m => m.role === 'user').length
        const started = new Date(session.created_at)
        const ended = session.ended_at ? new Date(session.ended_at) : null

        return (
          <Card key={session.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{emotionEmojis[session.dominant_emotion ?? 'neutral'] ?? '💬'}</span>
                  <div>
                    <p className="font-medium capitalize">{session.dominant_emotion ?? 'Chat Session'}</p>
                    <p className="text-xs text-muted-foreground">
                      {started.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {ended && (
                      <p className="text-xs text-muted-foreground">
                        Ended: {ended.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary">{userMsgCount} msg{userMsgCount !== 1 ? 's' : ''}</Badge>
              </div>
              {session.summary && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">{session.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function WeeklySummary() {
  const [todayEntries, setTodayEntries] = useState<LocalMoodEntry[]>([])
  const [weekEntries, setWeekEntries] = useState<LocalMoodEntry[]>([])
  const [monthEntries, setMonthEntries] = useState<LocalMoodEntry[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [todayFactor, setTodayFactor] = useState<LocalDailyFactor | null>(null)
  const [weekFactors, setWeekFactors] = useState<LocalDailyFactor[]>([])
  const [monthFactors, setMonthFactors] = useState<LocalDailyFactor[]>([])

  const loadData = useCallback(() => {
    setTodayEntries(getTodayEntries())
    setWeekEntries(getWeekEntries())
    setMonthEntries(getMonthEntries())
    setChatSessions(getEndedChatSessions())
    setTodayFactor(getTodayFactor())
    setWeekFactors(getRecentFactors(7))
    setMonthFactors(getRecentFactors(30))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-24">
      <div className="space-y-1">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">Summary</h1>
        <p className="text-sm text-muted-foreground">Your emotional journey at a glance</p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4 space-y-4">
          <DailyFactorCard factor={todayFactor} />
          <SummaryPanel entries={todayEntries} label="Day" onDeleted={loadData} />
        </TabsContent>

        <TabsContent value="weekly" className="mt-4 space-y-4">
          <SummaryPanel entries={weekEntries} label="Week" onDeleted={loadData} />
          <FactorsHistoryPanel factors={weekFactors} />
        </TabsContent>

        <TabsContent value="monthly" className="mt-4 space-y-4">
          <SummaryPanel entries={monthEntries} label="Month" onDeleted={loadData} />
          <FactorsHistoryPanel factors={monthFactors} />
        </TabsContent>

        <TabsContent value="chats" className="mt-4">
          <ChatSessionsPanel sessions={chatSessions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
