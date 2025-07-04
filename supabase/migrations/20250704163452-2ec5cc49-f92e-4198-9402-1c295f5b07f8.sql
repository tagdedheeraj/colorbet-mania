
-- Add new columns to game_periods table for admin control
ALTER TABLE public.game_periods 
ADD COLUMN game_mode_type TEXT DEFAULT 'automatic' CHECK (game_mode_type IN ('automatic', 'manual')),
ADD COLUMN admin_set_result_color TEXT,
ADD COLUMN admin_set_result_number INTEGER,
ADD COLUMN is_result_locked BOOLEAN DEFAULT false;

-- Create admin_logs table for tracking admin actions
CREATE TABLE public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for admin_logs table
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to view all logs
CREATE POLICY "Admins can view all logs" 
  ON public.admin_logs 
  FOR SELECT 
  USING (true);

-- Policy to allow admins to insert logs
CREATE POLICY "Admins can create logs" 
  ON public.admin_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Add some indexes for better performance
CREATE INDEX idx_admin_logs_admin_user_id ON public.admin_logs(admin_user_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX idx_game_periods_status ON public.game_periods(status);
CREATE INDEX idx_bets_period_number ON public.bets(period_number);
