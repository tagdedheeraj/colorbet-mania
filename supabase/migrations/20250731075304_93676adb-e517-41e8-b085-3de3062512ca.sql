
-- Fix the bets table user_id column to be NOT NULL for security
ALTER TABLE public.bets ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies for bets table to fix INSERT policy
DROP POLICY IF EXISTS "Users can create own bets" ON public.bets;

CREATE POLICY "Users can create own bets" ON public.bets
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Ensure service role can still manage all bets operations
DROP POLICY IF EXISTS "Service role can manage bets" ON public.bets;

CREATE POLICY "Service role can manage bets" ON public.bets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update games table policies to ensure proper access
DROP POLICY IF EXISTS "Service role can manage games" ON public.games;

CREATE POLICY "Service role can manage games" ON public.games
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure users table has proper policies for balance updates
DROP POLICY IF EXISTS "Service can create users" ON public.users;

CREATE POLICY "Service can create users" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Add index on bets table for better performance
CREATE INDEX IF NOT EXISTS idx_bets_user_game ON public.bets(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_bets_game_created ON public.bets(game_id, created_at DESC);

-- Add index on games table for active game queries
CREATE INDEX IF NOT EXISTS idx_games_status_number ON public.games(status, game_number DESC);
