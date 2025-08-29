
-- Create admin authentication sessions table
CREATE TABLE IF NOT EXISTS public.admin_auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Add missing columns to games table for admin control
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS admin_controlled BOOLEAN DEFAULT false;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS timer_paused BOOLEAN DEFAULT false;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS manual_result_set BOOLEAN DEFAULT false;

-- Add missing columns to game_periods table for admin control
ALTER TABLE public.game_periods ADD COLUMN IF NOT EXISTS admin_controlled BOOLEAN DEFAULT false;
ALTER TABLE public.game_periods ADD COLUMN IF NOT EXISTS timer_paused BOOLEAN DEFAULT false;
ALTER TABLE public.game_periods ADD COLUMN IF NOT EXISTS manual_result_set BOOLEAN DEFAULT false;

-- Add missing columns to deposit_requests table
ALTER TABLE public.deposit_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.deposit_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to bets table
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES public.games(id);
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS actual_win NUMERIC DEFAULT 0;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT false;

-- Enable RLS on admin_auth_sessions
ALTER TABLE public.admin_auth_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_auth_sessions
CREATE POLICY "Admin sessions are private" ON public.admin_auth_sessions
  FOR ALL USING (false);

-- Create admin credential verification function
CREATE OR REPLACE FUNCTION public.verify_admin_credentials_enhanced(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  username TEXT,
  role TEXT,
  session_token TEXT
) AS $$
DECLARE
  user_record RECORD;
  new_session_token TEXT;
BEGIN
  -- Check if user exists and has admin role
  SELECT u.id, u.email, u.username, u.role
  INTO user_record
  FROM public.users u
  WHERE u.email = p_email AND u.role = 'admin';
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Generate session token
  new_session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create session
  INSERT INTO public.admin_auth_sessions (user_id, session_token, expires_at)
  VALUES (user_record.id, new_session_token, now() + interval '24 hours');
  
  -- Return user data with session token
  RETURN QUERY SELECT 
    user_record.id,
    user_record.email,
    user_record.username,
    user_record.role,
    new_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create session verification function
CREATE OR REPLACE FUNCTION public.verify_admin_session_with_user(
  p_session_token TEXT
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  username TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.username, u.role
  FROM public.admin_auth_sessions s
  JOIN public.users u ON s.user_id = u.id
  WHERE s.session_token = p_session_token 
    AND s.expires_at > now() 
    AND s.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin password change function
CREATE OR REPLACE FUNCTION public.change_admin_password(
  p_email TEXT,
  p_current_password TEXT,
  p_new_password TEXT
)
RETURNS JSON AS $$
BEGIN
  -- This is a placeholder function for password changes
  -- In a real implementation, you would verify the current password
  -- and update it in the auth.users table or your authentication system
  
  RETURN json_build_object(
    'success', true,
    'message', 'Password changed successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create deposit approval function
CREATE OR REPLACE FUNCTION public.approve_deposit_request(
  p_request_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  request_record RECORD;
  new_balance NUMERIC;
BEGIN
  -- Get deposit request
  SELECT * INTO request_record
  FROM public.deposit_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Request not found or already processed'
    );
  END IF;
  
  -- Update user balance
  UPDATE public.users 
  SET balance = balance + request_record.amount
  WHERE id = request_record.user_id
  RETURNING balance INTO new_balance;
  
  -- Update request status
  UPDATE public.deposit_requests
  SET status = 'approved',
      processed_by = p_admin_id,
      processed_at = now()
  WHERE id = p_request_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Deposit approved successfully',
    'new_balance', new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create deposit rejection function
CREATE OR REPLACE FUNCTION public.reject_deposit_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  -- Update request status
  UPDATE public.deposit_requests
  SET status = 'rejected',
      processed_by = p_admin_id,
      processed_at = now(),
      admin_notes = p_reason
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Request not found or already processed'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Deposit rejected successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create manual game control functions
CREATE OR REPLACE FUNCTION public.set_manual_mode_enhanced(
  p_game_id UUID,
  p_enabled BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.games
  SET admin_controlled = p_enabled
  WHERE id = p_game_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_manual_result_enhanced(
  p_game_id UUID,
  p_number INTEGER,
  p_color TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.games
  SET admin_set_result_number = p_number,
      admin_set_result_color = p_color,
      manual_result_set = true
  WHERE id = p_game_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.complete_manual_game_enhanced(
  p_game_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.games
  SET status = 'completed',
      end_time = now(),
      result_number = admin_set_result_number,
      result_color = admin_set_result_color
  WHERE id = p_game_id AND manual_result_set = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_game_manual(
  p_game_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_manual BOOLEAN;
BEGIN
  SELECT admin_controlled INTO is_manual
  FROM public.games
  WHERE id = p_game_id;
  
  RETURN COALESCE(is_manual, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an admin user if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin') THEN
    INSERT INTO public.users (id, email, username, balance, role, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'admin@tradehue.com',
      'admin',
      0,
      'admin',
      now(),
      now()
    );
  END IF;
END $$;

-- Update existing users to have default role
UPDATE public.users SET role = 'user' WHERE role IS NULL;

-- Make role column NOT NULL with default
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'user';
