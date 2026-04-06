import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Send as SendIcon, Sparkles as SparklesIcon, User as UserIcon, LogOut as EndIcon, Plus as PlusIcon } from 'lucide-react'
import { saveChatSession, type ChatSession, type ChatMessage } from '@/lib/storage'
import { getChatResponseFromGemini, generateChatSessionSummaryWithGemini } from '@/lib/gemini'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const WELCOME = "Hello! I'm your emotional intelligence companion. I'm here to listen and support you. How are you feeling today?"

// ── Inner component — remounted on "New Chat" via key ────────────────────────

function ChatInner({ onNewChat }: { onNewChat: () => void }) {
  const [sessionId] = useState(() => crypto.randomUUID())
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: WELCOME, created_at: new Date().toISOString() },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [ended, setEnded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (messages.length > 1) {
      saveChatSession({
        id: sessionId,
        messages,
        summary: null,
        dominant_emotion: null,
        created_at: messages[0].created_at,
        ended_at: null,
      })
    }
  }, [messages, sessionId])

  const handleSend = async () => {
    if (!inputValue.trim() || ended) return

    const userMsg: ChatMessage = { role: 'user', content: inputValue, created_at: new Date().toISOString() }
    const currentMessages = [...messages, userMsg]
    setMessages(currentMessages)
    setInputValue('')
    setIsTyping(true)

    // Pass full conversation history to Gemini for contextual responses
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const responseText = await getChatResponseFromGemini(history, inputValue)

    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: responseText,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, assistantMsg])
    setIsTyping(false)
  }

  const handleEndChat = async () => {
    setEnded(true)
    toast.success('Generating summary…')

    const { summary, dominant_emotion } = await generateChatSessionSummaryWithGemini(
      messages.map(m => ({ role: m.role, content: m.content }))
    )

    const session: ChatSession = {
      id: sessionId,
      messages,
      summary,
      dominant_emotion,
      created_at: messages[0].created_at,
      ended_at: new Date().toISOString(),
    }
    saveChatSession(session)
    toast.success('Chat summary saved to Summary tab')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex h-[calc(100svh-4rem)] flex-col pb-16">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <SparklesIcon className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Smart Assistant</h2>
                <p className="text-xs text-muted-foreground">The Digital Breath</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {ended ? (
                <Button variant="outline" size="sm" onClick={onNewChat}>
                  <PlusIcon className="mr-1.5 h-4 w-4" />
                  New Chat
                </Button>
              ) : messages.length > 1 ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <EndIcon className="mr-1.5 h-4 w-4" />
                      End Chat
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>End this conversation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The chat will be summarised and saved to the Summary tab. You can start a new chat afterwards.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Continue chatting</AlertDialogCancel>
                      <AlertDialogAction onClick={handleEndChat}>End &amp; Save</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-4 p-4">
          {messages.map((message, i) => (
            <div key={i} className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'assistant' && (
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-primary/10">
                    <SparklesIcon className="size-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col gap-1 max-w-[85%]">
                <Card className={cn('p-3', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50')}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </Card>
                <p className={cn('text-[10px] text-muted-foreground', message.role === 'user' ? 'text-right' : 'text-left')}>
                  {new Date(message.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
              {message.role === 'user' && (
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-secondary"><UserIcon className="size-4" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-primary/10"><SparklesIcon className="size-4 text-primary" /></AvatarFallback>
              </Avatar>
              <Card className="bg-muted/50 p-3">
                <div className="flex gap-1">
                  <div className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                  <div className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                  <div className="size-2 animate-bounce rounded-full bg-muted-foreground/50" />
                </div>
              </Card>
            </div>
          )}

          {ended && (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Chat ended and saved to Summary. Tap <strong>New Chat</strong> to start fresh.
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {!ended && (
        <div className="border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-2xl gap-2">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!inputValue.trim() || isTyping} size="icon">
              <SendIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Public export — handles New Chat by incrementing key ─────────────────────

export function ChatAssistant() {
  const [chatKey, setChatKey] = useState(0)
  return <ChatInner key={chatKey} onNewChat={() => setChatKey(k => k + 1)} />
}
