
-- Fix the current active game by setting proper end_time
UPDATE game_periods 
SET end_time = NOW() + INTERVAL '60 seconds'
WHERE period_number = 90001 AND status = 'active';

-- Add balance to the current user for testing (replace with actual user ID)
UPDATE profiles 
SET balance = 1000.00, updated_at = NOW()
WHERE id = (SELECT auth.uid());

-- If the above doesn't work because auth.uid() is null, use this alternative:
-- UPDATE profiles SET balance = 1000.00, updated_at = NOW() WHERE email = 'your-email@example.com';
