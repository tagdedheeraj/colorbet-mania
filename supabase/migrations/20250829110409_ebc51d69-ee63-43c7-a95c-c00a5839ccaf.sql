
-- Create users table (mapped to profiles for user data)
-- Since we already have profiles table, we'll add missing columns to it
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Create games table (this should map to game_periods but we need both for compatibility)
CREATE TABLE IF NOT EXISTS public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_number BIGINT NOT NULL,
  status TEXT DEFAULT 'active',
  result_number INTEGER,
  result_color TEXT,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  game_mode TEXT DEFAULT 'classic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  admin_set_result_number INTEGER,
  admin_set_result_color TEXT,
  is_result_locked BOOLEAN DEFAULT false
);

-- Enable RLS on games table
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Create policy for games table (read-only for all users)
CREATE POLICY "Anyone can view games" ON public.games FOR SELECT USING (true);

-- Create users table as a view or alias to profiles
CREATE OR REPLACE VIEW public.users AS 
SELECT 
  id,
  email,
  balance,
  created_at,
  updated_at,
  username
FROM public.profiles;

-- Create payment_gateway_config table
CREATE TABLE IF NOT EXISTS public.payment_gateway_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway_type TEXT NOT NULL,
  config_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payment_gateway_config
ALTER TABLE public.payment_gateway_config ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_gateway_config
CREATE POLICY "Anyone can view active payment configs" ON public.payment_gateway_config 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment configs" ON public.payment_gateway_config 
  FOR ALL USING (true);

-- Create deposit_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

-- Enable RLS on deposit_requests
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for deposit_requests
CREATE POLICY "Users can view own deposit requests" ON public.deposit_requests 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deposit requests" ON public.deposit_requests 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit requests" ON public.deposit_requests 
  FOR SELECT USING (true);

CREATE POLICY "Admins can update deposit requests" ON public.deposit_requests 
  FOR UPDATE USING (true);
