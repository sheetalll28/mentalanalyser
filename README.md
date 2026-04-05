# Serenity Lab - AI Mood Tracker

A production-ready emotional intelligence companion built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### 1. Mood Entry & Analysis
- Journal entry interface with natural language processing
- Real-time emotion detection (happy, sad, anxious, calm, excited, tired, stressed, neutral)
- Confidence scoring with visual feedback
- AI-generated personalized insights

### 2. Smart Assistant Chatbot
- Empathetic, context-aware responses
- Rule-based conversation engine
- Persistent chat history
- Real-time typing indicators

### 3. Mood Dashboard
- Weekly mood trend visualization
- Emotion distribution analytics
- Confidence score tracking
- Key insights and patterns

### 4. Daily Lifestyle Factors
- Sleep hours tracking
- Caffeine intake monitoring
- Exercise logging
- Correlation insights between lifestyle and mood

### 5. Weekly Summary
- Automated weekly insights
- Trend analysis (improving/stable/declining)
- Emotion breakdown statistics
- Recent entries review

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI**: shadcn/ui components with Tailwind CSS v4
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Styling**: OKLCH color system, custom teal/cyan theme

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (optional for demo mode)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd serenity-lab
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your Supabase credentials in `.env`:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Setup

The application includes pre-configured database migrations. The schema will be automatically applied when you connect to Supabase.

Tables created:
- `mood_entries` - Stores journal entries and emotion analysis
- `chat_messages` - Stores chatbot conversation history
- `daily_factors` - Stores daily lifestyle factors (sleep, caffeine, exercise)

All tables include Row Level Security (RLS) policies for secure multi-user support.

### Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Demo Mode

The application works in demo mode without authentication:
- All features are fully functional
- Data is stored in browser memory only
- No account required to test the interface

## Features Detail

### Emotion Analysis Algorithm

The mood analysis engine uses keyword-based detection with confidence scoring:
- Scans input text for emotional keywords
- Calculates confidence based on keyword density
- Selects appropriate insights from curated database
- Provides contextual, empathetic feedback

### Chatbot Intelligence

The smart assistant uses pattern matching to provide:
- Empathetic responses to sadness/distress
- Positive reinforcement for happy states
- Grounding techniques for anxiety
- Energy management tips for fatigue
- General supportive conversation

### Data Privacy

- All user data stored with RLS protection
- Each user can only access their own data
- No data sharing between users
- Client-side encryption ready

## Customization

### Theme Colors

Edit `src/index.css` to customize the color scheme. The app uses OKLCH color space for perceptually uniform colors:

```css
:root {
  --primary: oklch(0.55 0.15 200); /* Calming teal */
  --accent: oklch(0.94 0.02 200);  /* Light teal */
}
```

### Emotion Keywords

Extend the emotion detection in `src/lib/emotion-analysis.ts`:

```typescript
const emotionKeywords: Record<Emotion, string[]> = {
  happy: ['happy', 'joy', 'great', ...],
  // Add more emotions or keywords
}
```

## Architecture

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   └── navigation.tsx   # Bottom navigation
├── pages/
│   ├── mood-entry.tsx       # Mood input & analysis
│   ├── chat-assistant.tsx   # Chatbot interface
│   ├── dashboard.tsx        # Analytics dashboard
│   ├── daily-factors.tsx    # Lifestyle tracking
│   └── weekly-summary.tsx   # Weekly insights
├── lib/
│   ├── emotion-analysis.ts  # AI simulation logic
│   ├── supabase.ts          # Database client
│   └── utils.ts             # Helper functions
└── App.tsx                  # Main app with routing
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

## Credits

Built with [shadcn/ui](https://ui.shadcn.com) - Beautiful, accessible components
