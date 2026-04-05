# Serenity Lab - Quick Start Guide

Get started in 5 minutes!

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Open http://localhost:5173 and start using the app!

## 5 Main Pages

| Page | Icon | Features |
|------|------|----------|
| **Entry** | 📝 | Write mood entries, AI emotion detection, insights |
| **Chat** | 💬 | Talk to AI assistant, get emotional support |
| **Dashboard** | 📊 | View mood trends, emotion charts, analytics |
| **Factors** | 💪 | Track sleep, caffeine, exercise, lifestyle insights |
| **Summary** | 📈 | Weekly narrative, trends, emotion breakdown |

## Key Features

### Emotion Detection
Type a mood entry and get instant analysis:
- **Emotion**: happy, sad, anxious, calm, excited, tired, stressed, neutral
- **Confidence**: 0-100% score
- **Insight**: Personalized psychological feedback

### Smart Chatbot
Chat naturally and get context-aware responses. The AI understands:
- Emotional keywords
- Stress and anxiety
- Celebrations and victories
- Need for encouragement

### Analytics Dashboard
See your mood patterns:
- 7-day trend chart
- Emotion distribution
- Confidence tracking
- Weekly insights

### Lifestyle Tracking
Connect habits to mood:
- Sleep hours (0-12)
- Caffeine intake (0-8+)
- Exercise (yes/no)
- Smart correlations

### Weekly Summary
Automated insights about:
- Your emotional trend
- Most common feelings
- Confidence levels
- Actionable recommendations

## Dark Mode

- Toggle with **☀️/🌙** icon in header
- Keyboard shortcut: Press **D**
- Default: Dark mode
- Saves automatically

## Optional: Connect Supabase

Add real data persistence:

```bash
# 1. Get Supabase credentials
# Visit https://supabase.com → Create project

# 2. Add to .env
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key

# 3. Restart the app
npm run dev
```

**Note**: Works great without Supabase! Uses demo data in browser.

## Commands

```bash
npm run dev      # Start development server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run typecheck # Check TypeScript types
```

## Build for Production

```bash
npm run build

# Then deploy the "dist" folder to:
# - Vercel
# - Netlify
# - GitHub Pages
# - Any static host
```

## Features Without Supabase

✅ All features work in demo mode:
- Emotion analysis
- Chat responses
- Dashboard analytics
- Lifestyle tracking
- Weekly insights
- Dark mode
- Full navigation

**Try it before connecting Supabase!**

## Troubleshooting

### Port Already In Use
```bash
npm run dev -- --port 3000
```

### Clear Browser Cache
```javascript
// Open browser console (F12) and run:
localStorage.clear()
location.reload()
```

### TypeScript Errors
```bash
npm run typecheck
```

## Learn More

- **Setup Guide**: See `SETUP.md` for detailed instructions
- **Project Status**: See `PROJECT_STATUS.md` for feature list
- **Full README**: See `README.md` for complete documentation

---

**That's it! Start exploring your emotional landscape.** 🌟
