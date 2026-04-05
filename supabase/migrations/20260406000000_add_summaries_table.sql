-- Create summaries table for storing automated daily/weekly/monthly summaries
CREATE TABLE IF NOT EXISTS summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary_type TEXT NOT NULL CHECK (summary_type IN ('daily', 'weekly', 'monthly')),
    summary_date DATE NOT NULL,
    dominant_emotion TEXT,
    emotion_distribution JSONB,
    trend TEXT,
    narrative TEXT,
    insights TEXT[],
    entry_count INTEGER DEFAULT 0,
    average_confidence INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, summary_type, summary_date)
);

-- Create index for efficient querying
CREATE INDEX idx_summaries_user_date ON summaries(user_id, summary_date DESC);
CREATE INDEX idx_summaries_user_type_date ON summaries(user_id, summary_type, summary_date DESC);

-- Enable Row Level Security
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for summaries table
CREATE POLICY "Users can view their own summaries"
    ON summaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summaries"
    ON summaries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries"
    ON summaries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries"
    ON summaries FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_summaries_timestamp
    BEFORE UPDATE ON summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_summaries_updated_at();
