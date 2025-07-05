
-- Phase 1: Complete the stuck game #90001
UPDATE game_periods 
SET status = 'completed',
    result_color = 'red',
    result_number = 7,
    end_time = NOW() - INTERVAL '1 minute'
WHERE period_number = 90001 AND status = 'active';

-- Phase 2: Add sufficient balance to current user for testing
UPDATE profiles 
SET balance = 5000.00, 
    updated_at = NOW()
WHERE id = (SELECT auth.uid());

-- Phase 3: Create a fresh active game #90002 with proper timing
INSERT INTO game_periods (
    period_number,
    start_time,
    end_time,
    status,
    game_mode_type
) VALUES (
    90002,
    NOW(),
    NOW() + INTERVAL '60 seconds',
    'active',
    'automatic'
);

-- Phase 4: Clean up any other stuck active games (safety measure)
UPDATE game_periods 
SET status = 'completed',
    result_color = 'green',
    result_number = 3,
    end_time = NOW() - INTERVAL '2 minutes'
WHERE status = 'active' AND period_number != 90002;
