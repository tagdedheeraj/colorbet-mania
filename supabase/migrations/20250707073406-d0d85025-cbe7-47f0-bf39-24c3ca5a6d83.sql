
-- Phase 1: Database Cleanup & Schema Fixes

-- First, complete all active games except the most recent one
UPDATE games 
SET status = 'completed',
    result_color = 'green',
    result_number = 5,
    end_time = NOW() - INTERVAL '1 minute'
WHERE status = 'active' 
  AND id NOT IN (
    SELECT id FROM games 
    WHERE status = 'active' 
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- Ensure we have at least one active game with proper timing
INSERT INTO games (
  game_number,
  start_time,
  end_time,
  status,
  game_mode
)
SELECT 
  COALESCE(MAX(game_number), 10000) + 1,
  NOW(),
  NOW() + INTERVAL '60 seconds',
  'active',
  'quick'
FROM games
WHERE NOT EXISTS (
  SELECT 1 FROM games WHERE status = 'active'
);

-- Update user balance to ensure they can place bets
UPDATE users 
SET balance = 5000.00, 
    updated_at = NOW()
WHERE id = (SELECT auth.uid());
