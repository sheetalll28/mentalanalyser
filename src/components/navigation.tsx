import { PenTool as PenToolIcon, MessageSquare as MessageSquareIcon, ChartBar as BarChartIcon, Activity as ActivityIcon, FileText as FileTextIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Page = 'mood' | 'chat' | 'dashboard' | 'factors' | 'summary'

interface NavigationProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

const navItems: Array<{ id: Page; label: string; icon: typeof PenToolIcon }> = [
  { id: 'mood', label: 'Entry', icon: PenToolIcon },
  { id: 'chat', label: 'Chat', icon: MessageSquareIcon },
  { id: 'dashboard', label: 'Dashboard', icon: BarChartIcon },
  { id: 'factors', label: 'Factors', icon: ActivityIcon },
  { id: 'summary', label: 'Summary', icon: FileTextIcon },
]

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-screen-sm items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
