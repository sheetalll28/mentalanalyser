/*
  # Mood Tracker Schema

  1. New Tables
    - `mood_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `entry_text` (text, the mood journal entry)
      - `emotion` (text, detected emotion: happy, sad, anxious, calm, excited, tired, stressed, neutral)
      - `confidence` (integer, 0-100, confidence score)
      - `insight` (text, AI-generated insight)
      - `created_at` (timestamptz)
      
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text, 'user' or 'assistant')
      - `content` (text, message content)
      - `created_at` (timestamptz)
      
    - `daily_factors`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date, unique per user per day)
      - `sleep_hours` (numeric, 0-24)
      - `caffeine_intake` (integer, cups/servings)
      - `exercise` (boolean)
      - `insight` (text, correlation insight)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_text text NOT NULL,
  emotion text NOT NULL,
  confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  insight text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood entries"
  ON mood_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON mood_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- daily_factors table
CREATE TABLE IF NOT EXISTS daily_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours numeric NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  caffeine_intake integer NOT NULL DEFAULT 0 CHECK (caffeine_intake >= 0),
  exercise boolean NOT NULL DEFAULT false,
  insight text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily factors"
  ON daily_factors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily factors"
  ON daily_factors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily factors"
  ON daily_factors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily factors"
  ON daily_factors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id_created_at ON mood_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id_created_at ON chat_messages(user_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_daily_factors_user_id_date ON daily_factors(user_id, date DESC);
