
-- Add indexes for better performance on betting queries
CREATE INDEX IF NOT EXISTS idx_bets_game_id_bet_type ON public.bets(game_id, bet_type);
CREATE INDEX IF NOT EXISTS idx_bets_game_id_bet_value ON public.bets(game_id, bet_value);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON public.bets(created_at);
CREATE INDEX IF NOT EXISTS idx_games_status_created_at ON public.games(status, created_at);

-- Create a materialized view for quick betting analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.live_betting_analytics AS
SELECT 
  g.id as game_id,
  g.game_number,
  g.status,
  COUNT(DISTINCT b.user_id) as unique_players,
  COUNT(b.id) as total_bets,
  COALESCE(SUM(b.amount), 0) as total_amount,
  jsonb_object_agg(
    COALESCE(b.bet_value, 'no_bets'),
    jsonb_build_object(
      'count', COUNT(b.id),
      'amount', COALESCE(SUM(b.amount), 0),
      'users', COUNT(DISTINCT b.user_id)
    )
  ) FILTER (WHERE b.bet_type = 'number') as number_breakdown
FROM public.games g
LEFT JOIN public.bets b ON g.id = b.game_id AND b.bet_type = 'number'
WHERE g.status = 'active'
GROUP BY g.id, g.game_number, g.status;

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_live_betting_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.live_betting_analytics;
END;
$$;

-- Create a function to get detailed bet information for live games
CREATE OR REPLACE FUNCTION get_live_game_detailed_bets(p_game_id uuid)
RETURNS TABLE(
  bet_id uuid,
  username text,
  bet_type text,
  bet_value text,
  amount numeric,
  potential_win numeric,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    u.username,
    b.bet_type,
    b.bet_value,
    b.amount,
    b.potential_win,
    b.created_at
  FROM public.bets b
  JOIN public.users u ON b.user_id = u.id
  WHERE b.game_id = p_game_id
  ORDER BY b.created_at DESC;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.live_betting_analytics TO authenticated, anon;
GRANT EXECUTE ON FUNCTION refresh_live_betting_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_live_game_detailed_bets(uuid) TO authenticated;
