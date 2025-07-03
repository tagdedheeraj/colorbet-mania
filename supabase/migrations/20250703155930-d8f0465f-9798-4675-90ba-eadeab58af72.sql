
-- Add admin role to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create admin_logs table for tracking admin activities
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES public.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'game', 'bet', 'transaction'
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin logs (only admins can view)
CREATE POLICY "Admins can view admin logs" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy for inserting admin logs
CREATE POLICY "Admins can insert admin logs" ON public.admin_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bets_user_game ON public.bets(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_games_status_created ON public.games(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_created ON public.admin_logs(admin_user_id, created_at DESC);
