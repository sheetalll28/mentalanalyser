import { useState } from 'react'
import { MoodEntry } from '@/pages/mood-entry'
import { ChatAssistant } from '@/pages/chat-assistant'
import { Dashboard } from '@/pages/dashboard'
import { DailyFactors } from '@/pages/daily-factors'
import { WeeklySummary } from '@/pages/weekly-summary'
import { Navigation } from '@/components/navigation'
import { ModeToggle } from '@/components/mode-toggle'
import { Onboarding } from '@/components/onboarding'
import { Sparkles as SparklesIcon } from 'lucide-react'
import { isOnboarded } from '@/lib/storage'

type Page = 'mood' | 'chat' | 'dashboard' | 'factors' | 'summary'

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>('mood')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [summaryKey, setSummaryKey] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboarded())

  const handlePageChange = (page: Page) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentPage(page)
      if (page === 'summary') setSummaryKey(k => k + 1)
      setIsTransitioning(false)
    }, 150)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <SparklesIcon className="size-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Serenity Lab</h1>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {currentPage === 'mood' && <MoodEntry />}
          {currentPage === 'chat' && <ChatAssistant />}
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'factors' && <DailyFactors />}
          {currentPage === 'summary' && <WeeklySummary key={summaryKey} />}
        </div>
      </main>

      <Navigation currentPage={currentPage} onPageChange={handlePageChange} />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
    </div>
  )
}

export default App
