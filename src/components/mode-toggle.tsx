import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

const THEMES = ['light', 'dark', 'system'] as const

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    const next = THEMES[(THEMES.indexOf(theme as typeof THEMES[number]) + 1) % THEMES.length]
    setTheme(next)
  }

  return (
    <Button variant="outline" size="icon" onClick={cycle} title={`Theme: ${theme}`}>
      {theme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : theme === 'light' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Monitor className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
