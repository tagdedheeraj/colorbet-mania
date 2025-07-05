
-- Phase 1: Fix current user balance
UPDATE profiles 
SET balance = 5000.00, 
    updated_at = NOW()
WHERE id = (SELECT auth.uid());

-- Phase 2: Fix current game timing - extend Game #90002
UPDATE game_periods 
SET end_time = NOW() + INTERVAL '60 seconds',
    start_time = NOW()
WHERE period_number = 90002 AND status = 'active';

-- Phase 3: Clean up any duplicate or stuck games
UPDATE game_periods 
SET status = 'completed',
    result_color = 'green',
    result_number = 5,
    end_time = NOW() - INTERVAL '5 minutes'
WHERE status = 'active' AND period_number < 90002;

-- Phase 4: Ensure only one active game exists
UPDATE game_periods 
SET status = 'completed',
    result_color = 'red',
    result_number = 8,
    end_time = NOW() - INTERVAL '3 minutes'
WHERE status = 'active' AND period_number > 90002;
