# Serenity Lab - Setup Instructions

## New Features Implemented

### 1. Authentication System
- **Login/Signup Pages**: Full authentication flow with email and password
- **Session Management**: Automatic session handling with logout functionality
- **Secure Access**: All data is now protected with Row Level Security (RLS)

### 2. Voice Input
- **Speech-to-Text**: Real-time voice recording with speech recognition
- **Browser Support**: Works in Chrome, Edge, and other browsers with Web Speech API
- **Live Transcription**: See your words appear as you speak

### 3. Background Summarization
- **Automatic Summaries**: Daily, weekly, and monthly summaries generated automatically
- **Smart Insights**: AI-generated insights based on your mood patterns
- **Trend Analysis**: Track how your emotions change over time

### 4. Monthly Dashboard View
- **Extended Analytics**: View your mood data over 30 days
- **Comparative Views**: Switch between weekly and monthly views
- **Enhanced Charts**: Better visualizations for longer time periods

## Database Migration Required

To enable the new summarization features, you need to run the database migration:

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project (you'll need your project reference)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option 2: Manual Migration via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Open and copy the contents of `/supabase/migrations/20260406000000_add_summaries_table.sql`
5. Paste and run the SQL

## How to Use New Features

### Voice Input
1. Navigate to the **Entry** tab
2. Click "Start Voice Input" button
3. Grant microphone permissions when prompted
4. Speak your mood entry
5. Click "Stop Recording" when done
6. Review the transcribed text and click "Analyze My Mood"

### Viewing Summaries
Summaries are automatically generated when you:
- Add a new mood entry
- Chat with the assistant (stores conversation)

To view summaries:
- **Weekly Summary**: Navigate to the Summary tab (already implemented)
- **Dashboard**: Switch between Week/Month views using the buttons in the header

### Authentication
1. On first launch, you'll see the login/signup page
2. Create an account or sign in
3. All your data will be saved securely
4. Click the logout button (top right) to sign out

## Browser Compatibility

### Voice Input Requirements
- **Supported**: Chrome, Edge, Safari (iOS 14.5+)
- **Not Supported**: Firefox, older browsers
- Falls back to text-only input on unsupported browsers

### Recommended Setup
- Use **Google Chrome** or **Microsoft Edge** for best experience
- Enable microphone permissions
- Use a quiet environment for better voice recognition

## Environment Variables

Make sure your `.env` file contains:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Features Summary

✅ **Completed**:
- Authentication (login/signup/logout)
- Voice input with speech-to-text
- Background summarization system
- Monthly dashboard view
- Automated daily/weekly/monthly summaries
- Summaries database table

🚀 **Future Enhancements** (Optional):
- Real AI/LLM integration (OpenAI, Claude, etc.)
- Server-side audio processing for better accuracy
- Export functionality for mood data
- Advanced pattern recognition
- Push notifications for mood check-ins

## Troubleshooting

### Voice Input Not Working
- Check browser compatibility (use Chrome/Edge)
- Grant microphone permissions
- Check browser console for errors
- Ensure you're using HTTPS (voice API requires secure context)

### Database Migration Failed
- Verify Supabase project credentials
- Check SQL syntax in migration file
- Ensure you have admin permissions on the project

### Authentication Issues
- Clear browser cache and cookies
- Verify environment variables are set correctly
- Check Supabase Auth settings in dashboard

## Support

For issues or questions, refer to:
- Supabase Docs: https://supabase.com/docs
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
