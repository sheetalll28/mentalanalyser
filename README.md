# Serenity Lab

An AI-powered emotional wellness app. Log moods, chat with an empathetic AI companion, track lifestyle factors, and receive personalized weekly summaries.

## Features

| Feature | Description |
|---|---|
| **Mood Entry** | Text or voice input, 14-emotion quick-tap grid, Gemini-powered analysis |
| **Chat Assistant** | Contextual emotional support chatbot ("The Digital Breath") |
| **Dashboard** | Mood calendar, streak counter, trend charts, time-of-day insights |
| **Daily Factors** | Track sleep, caffeine, and exercise; see correlations with mood |
| **Summary** | AI-written daily/weekly/monthly narratives with session history |

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **AI**: Google Gemini 2.0 Flash Lite (with local fallback)
- **Storage**: localStorage (no backend required)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Add your Gemini API key
cp .env.example .env
# Edit .env → VITE_GEMINI_API_KEY=your_key_here

# 3. Start dev server
npm run dev
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com).

## Scripts

```bash
npm run dev        # Development server (localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build
npm run typecheck  # TypeScript check only
```

## Project Structure

```
src/
├── pages/
│   ├── mood-entry.tsx       # Mood input, voice, analysis
│   ├── chat-assistant.tsx   # AI chatbot
│   ├── dashboard.tsx        # Analytics & calendar
│   ├── daily-factors.tsx    # Lifestyle tracking
│   └── weekly-summary.tsx   # AI summaries
├── components/
│   ├── navigation.tsx       # Bottom nav
│   ├── onboarding.tsx       # First-launch walkthrough
│   ├── mode-toggle.tsx      # Dark/light/system theme
│   ├── theme-provider.tsx   # Theme context
│   └── ui/                  # shadcn/ui primitives
└── lib/
    ├── gemini.ts            # Gemini API (5 functions, all with fallbacks)
    ├── emotion-analysis.ts  # Local fallback logic + 14-emotion insights
    ├── storage.ts           # localStorage CRUD
    ├── summarization.ts     # Stats from mood entries
    └── utils.ts             # cn() helper
```

## Architecture Notes

- All data is stored in `localStorage` — no account, no server, no data leaves the device (except Gemini API calls).
- Every Gemini call has a graceful local fallback so the app works offline or when rate-limited.
- Gemini rate limit: 30 RPM on the free tier. The app retries on 429 with backoff before falling back.
