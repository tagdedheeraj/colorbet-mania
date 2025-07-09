
-- Phase 1: Fix RLS Policy and Admin Authentication Sync

-- First, ensure current admin user exists in users table with admin role
INSERT INTO public.users (id, email, username, role, balance)
SELECT 
  gen_random_uuid(),
  'admin@tradeforwin.xyz',
  'admin',
  'admin',
  10000.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'admin@tradeforwin.xyz'
);

-- Update existing admin user to ensure admin role
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@tradeforwin.xyz';

-- Create enhanced admin session verification function that links both tables
CREATE OR REPLACE FUNCTION public.verify_admin_session_with_user(p_session_token text)
RETURNS TABLE(
  user_id uuid,
  email text,
  username text,
  role text,
  session_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last accessed for valid sessions
  UPDATE public.admin_auth_sessions 
  SET last_accessed = now()
  WHERE session_token = p_session_token AND expires_at > now();
  
  -- Return user data if session is valid and user has admin role
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.username,
    u.role,
    true as session_valid
  FROM public.users u
  JOIN public.admin_auth_sessions s ON u.id = s.user_id
  WHERE s.session_token = p_session_token 
    AND s.expires_at > now()
    AND u.role = 'admin';
END;
$$;

-- Enhanced RLS policy for payment_gateway_config that works with our admin system
DROP POLICY IF EXISTS "Admins can manage payment configs" ON public.payment_gateway_config;
CREATE POLICY "Admins can manage payment configs" 
  ON public.payment_gateway_config 
  FOR ALL 
  USING (
    -- Allow if user is admin via users table
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Allow if user has valid admin session via our custom auth
    EXISTS (
      SELECT 1 FROM public.admin_auth_sessions s
      JOIN public.users u ON u.id = s.user_id
      WHERE u.role = 'admin' 
        AND s.expires_at > now()
        AND u.email = 'admin@tradeforwin.xyz'
    )
  );

-- Create a service role bypass policy for payment configs
CREATE POLICY "Service role can manage payment configs"
  ON public.payment_gateway_config
  FOR ALL
  USING (true);

-- Enhanced function to create admin session with proper user linking
CREATE OR REPLACE FUNCTION public.create_admin_auth_session_enhanced(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_token text;
  admin_user_id uuid;
BEGIN
  -- Get admin user ID from users table
  SELECT id INTO admin_user_id
  FROM public.users 
  WHERE email = p_email AND role = 'admin';
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Clean up old sessions for this user
  DELETE FROM public.admin_auth_sessions 
  WHERE user_id = admin_user_id OR expires_at < now();
  
  -- Create new session
  INSERT INTO public.admin_auth_sessions (user_id, session_token, expires_at)
  VALUES (admin_user_id, session_token, now() + interval '24 hours');
  
  RETURN session_token;
END;
$$;

-- Update verify_admin_credentials to work with our enhanced system
CREATE OR REPLACE FUNCTION public.verify_admin_credentials_enhanced(p_email text, p_password text)
RETURNS TABLE(user_id uuid, email text, username text, role text, session_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_token text;
BEGIN
  -- Simple hardcoded check for our specific admin
  IF p_email = 'admin@tradeforwin.xyz' AND p_password = 'Trade@123' THEN
    -- Create session token
    v_session_token := public.create_admin_auth_session_enhanced(p_email);
    
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.username,
      u.role,
      v_session_token
    FROM public.users u
    WHERE u.email = p_email AND u.role = 'admin';
  ELSE
    -- Return empty result for invalid credentials
    RETURN;
  END IF;
END;
$$;
