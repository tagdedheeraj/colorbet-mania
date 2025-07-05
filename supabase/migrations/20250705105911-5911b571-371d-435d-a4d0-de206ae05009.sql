
-- Phase 1: Fix current user balance to 5000 coins
UPDATE profiles 
SET balance = 5000.00, 
    updated_at = NOW()
WHERE id = (SELECT auth.uid());

-- Phase 2: Fix current game #90002 timing - extend it for 60 seconds from now
UPDATE game_periods 
SET end_time = NOW() + INTERVAL '60 seconds',
    start_time = NOW(),
    status = 'active'
WHERE period_number = 90002;

-- Phase 3: Complete any other active games to ensure only one active game
UPDATE game_periods 
SET status = 'completed',
    result_color = 'green',
    result_number = 5,
    end_time = NOW() - INTERVAL '5 minutes'
WHERE status = 'active' AND period_number != 90002;

-- Phase 4: Create a fresh game #90003 ready for next cycle
INSERT INTO game_periods (
    period_number,
    start_time,
    end_time,
    status,
    game_mode_type
) VALUES (
    90003,
    NOW() + INTERVAL '65 seconds',
    NOW() + INTERVAL '125 seconds',
    'pending',
    'automatic'
) ON CONFLICT (period_number) DO NOTHING;
