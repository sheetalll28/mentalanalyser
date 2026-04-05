# Serenity Lab - Setup Guide

A production-ready emotional intelligence companion with AI mood tracking, analytics, and insights.

## Quick Start

### 1. Environment Variables

Copy `.env.example` to `.env` and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Note**: The app works perfectly in demo mode without these credentials. Emotions, chat, and data tracking all function with simulated data stored in browser memory.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Build for Production

```bash
npm run build
npm run preview
```

## Features Overview

### 🎯 Mood Entry & Analysis
- Write journal entries about your feelings
- AI-powered emotion detection (happy, sad, anxious, calm, excited, tired, stressed, neutral)
- Real-time confidence scoring
- Personalized psychological insights

### 💬 Smart Assistant Chatbot
- Empathetic conversational companion
- Context-aware responses based on emotional keywords
- Full message history preserved
- Typing indicators and smooth animations

### 📊 Mood Dashboard
- 7-day mood trend visualization
- Emotion distribution charts
- Confidence score tracking
- Weekly patterns and insights
- Real-time analytics

### 📋 Daily Lifestyle Factors
- Sleep hours tracking (0-12 hours)
- Caffeine intake monitoring
- Exercise logging
- Intelligent correlation insights
- AI-generated recommendations

### 📈 Weekly Summary
- Automated narrative generation
- Trend analysis (improving/stable/declining)
- Emotion statistics and breakdown
- Recent entries timeline
- Actionable insights

## Navigation

The app uses a clean bottom navigation bar with 5 main sections:

1. **Entry** - Add new mood journal entries
2. **Chat** - Talk with your AI assistant
3. **Dashboard** - View mood analytics and charts
4. **Factors** - Track daily wellness habits
5. **Summary** - Read your weekly insights

## Dark/Light Mode

- Toggle via the sun/moon icon in the header
- Default: Dark mode (optimized for mood tracking)
- Keyboard shortcut: Press **D** to toggle
- Preference saved to localStorage

## Supabase Setup (Optional)

If you want to persist data to Supabase:

### 1. Create Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Copy your project URL and anon key

### 2. Configure Database
The database schema is pre-configured with three tables:

**mood_entries**
- User mood journal entries
- Emotion analysis results
- AI-generated insights
- Timestamps for tracking

**chat_messages**
- User and assistant messages
- Conversation history
- Message timestamps

**daily_factors**
- Sleep hours
- Caffeine intake
- Exercise tracking
- Lifestyle insights

All tables include:
- Row Level Security (RLS) for privacy
- User-specific data isolation
- Automatic timestamp tracking
- Indexes for performance

### 3. Add Credentials
Update `.env` with your Supabase URL and anon key

### 4. Start Using
The app automatically uses Supabase when credentials are provided. In demo mode, all data stays in browser memory.

## Demo Mode

The app includes smart fallbacks for demo mode:

```
✓ Mood analysis works with simulated AI
✓ Chat assistant responds contextually
✓ Dashboard shows demo data patterns
✓ Daily factors track in browser
✓ Weekly summaries generate insights
✓ All features fully functional
✓ No account required to test
```

Perfect for trying out features before connecting Supabase!

## File Structure

```
src/
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── navigation.tsx       # Bottom navigation
│   ├── mode-toggle.tsx      # Dark mode toggle
│   └── theme-provider.tsx   # Theme management
├── pages/
│   ├── mood-entry.tsx       # Mood input & analysis
│   ├── chat-assistant.tsx   # Chatbot interface
│   ├── dashboard.tsx        # Analytics dashboard
│   ├── daily-factors.tsx    # Lifestyle tracking
│   └── weekly-summary.tsx   # Weekly insights
├── lib/
│   ├── emotion-analysis.ts  # AI simulation logic
│   ├── supabase.ts          # Database client
│   └── utils.ts             # Utilities
├── App.tsx                  # Main routing
└── main.tsx                 # Entry point
```

## Emotion Detection Algorithm

The mood analysis engine uses:

1. **Keyword Scanning** - Matches emotional vocabulary
2. **Confidence Scoring** - Calculates certainty (0-100%)
3. **Insight Selection** - Chooses contextual feedback
4. **Pattern Recognition** - Learns from entries over time

Example emotions detected:
- **Happy**: joy, great, wonderful, fantastic, cheerful
- **Sad**: down, miserable, heartbroken, gloomy
- **Anxious**: worried, stressed, overwhelmed, panicked
- **Calm**: peaceful, serene, tranquil, centered
- **Excited**: thrilled, energized, enthusiastic, pumped
- **Tired**: exhausted, drained, fatigued, worn out
- **Stressed**: pressure, burden, strain, overwhelmed
- **Neutral**: okay, fine, normal, regular

## Customization

### Theme Colors

Edit `src/index.css` for custom colors:

```css
:root {
  --primary: oklch(0.55 0.15 200);      /* Primary teal */
  --accent: oklch(0.94 0.02 200);       /* Light accent */
  --destructive: oklch(0.577 0.245 27); /* Red warnings */
}
```

### Emotions & Keywords

Extend emotion detection in `src/lib/emotion-analysis.ts`:

```typescript
const emotionKeywords: Record<Emotion, string[]> = {
  happy: ['happy', 'joy', 'great', ...],
  // Add more emotions or keywords
}
```

### Chatbot Responses

Customize AI responses in `getChatbotResponse()` function:

```typescript
if (userMessage.includes('stressed')) {
  return 'Your custom supportive response...'
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Build errors
```bash
npm run typecheck
npm run build
```

### Demo mode not showing data
- Clear localStorage: `localStorage.clear()`
- Refresh the page

### Supabase connection issues
- Verify `.env` credentials
- Check Supabase project is active
- Confirm RLS policies are enabled
- Test in demo mode first

### Dark mode not working
- Check browser localStorage isn't disabled
- Press **D** key to force toggle
- Clear site storage and reload

## Support & Resources

- **shadcn/ui**: https://ui.shadcn.com
- **Supabase**: https://supabase.com/docs
- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com

## License

MIT - Feel free to use and modify!

---

**Built with care for emotional wellness** 🌟
