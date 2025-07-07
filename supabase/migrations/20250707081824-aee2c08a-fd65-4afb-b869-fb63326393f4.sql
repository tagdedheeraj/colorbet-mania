
-- Phase 1: Database Schema & RLS Fixes

-- Add admin-specific columns to games table for manual control
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS game_mode_type TEXT DEFAULT 'automatic' CHECK (game_mode_type IN ('automatic', 'manual')),
ADD COLUMN IF NOT EXISTS admin_set_result_color TEXT,
ADD COLUMN IF NOT EXISTS admin_set_result_number INTEGER,
ADD COLUMN IF NOT EXISTS admin_controlled BOOLEAN DEFAULT false;

-- Clean up multiple active games - keep only the most recent one
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

-- Fix RLS policies for admin access
-- Allow admins to view all users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" 
  ON public.users 
  FOR SELECT 
  USING (
    (auth.uid())::text = (id)::text 
    OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update user balances
DROP POLICY IF EXISTS "Admins can update user balances" ON public.users;
CREATE POLICY "Admins can update user balances" 
  ON public.users 
  FOR UPDATE 
  USING (
    (auth.uid())::text = (id)::text 
    OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to manage games
DROP POLICY IF EXISTS "Admins can manage games" ON public.games;
CREATE POLICY "Admins can manage games" 
  ON public.games 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to view all bets
DROP POLICY IF EXISTS "Admins can view all bets" ON public.bets;
CREATE POLICY "Admins can view all bets" 
  ON public.bets 
  FOR SELECT 
  USING (
    (auth.uid())::text = (user_id)::text 
    OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fix admin_logs RLS policies
DROP POLICY IF EXISTS "Admins can create logs" ON public.admin_logs;
CREATE POLICY "Admins can create logs" 
  ON public.admin_logs 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all logs" ON public.admin_logs;
CREATE POLICY "Admins can view all logs" 
  ON public.admin_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Set current user as admin for testing
UPDATE public.users 
SET role = 'admin' 
WHERE id = auth.uid();
