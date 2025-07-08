
-- Step 1: Clean up existing admin data
DELETE FROM public.users WHERE email IN ('admin@gameapp.com', 'admin@tradeforwin.xyz');

-- Step 2: Create the admin user properly in public.users table
-- This will be the authoritative admin record
INSERT INTO public.users (
  id,
  email, 
  username, 
  role, 
  balance, 
  referral_code,
  created_at,
  updated_at
) VALUES (
  '5a864770-ef91-4bd9-a5cf-fa4ea6893a75'::uuid,
  'admin@tradeforwin.xyz',
  'admin',
  'admin',
  50000.00,
  'ADMIN001',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  updated_at = now();

-- Step 3: Ensure the admin user has proper permissions
-- Update RLS policies to work with our admin system
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  USING (true);

-- Step 4: Create a simple admin authentication function
CREATE OR REPLACE FUNCTION public.verify_admin_credentials(
  p_email text,
  p_password text
)
RETURNS TABLE(
  user_id uuid,
  email text,
  username text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple hardcoded check for our specific admin
  IF p_email = 'admin@tradeforwin.xyz' AND p_password = 'Trade@123' THEN
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.username,
      u.role
    FROM public.users u
    WHERE u.email = p_email AND u.role = 'admin';
  ELSE
    -- Return empty result for invalid credentials
    RETURN;
  END IF;
END;
$$;

-- Step 5: Create admin session management
CREATE TABLE IF NOT EXISTS public.admin_auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  last_accessed timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin sessions
ALTER TABLE public.admin_auth_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage sessions
CREATE POLICY "Service role can manage admin sessions"
  ON public.admin_auth_sessions
  FOR ALL
  USING (true);

-- Step 6: Function to create admin session
CREATE OR REPLACE FUNCTION public.create_admin_auth_session(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_token text;
BEGIN
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Clean up old sessions for this user
  DELETE FROM public.admin_auth_sessions 
  WHERE user_id = p_user_id OR expires_at < now();
  
  -- Create new session
  INSERT INTO public.admin_auth_sessions (user_id, session_token)
  VALUES (p_user_id, session_token);
  
  RETURN session_token;
END;
$$;

-- Step 7: Function to verify admin session
CREATE OR REPLACE FUNCTION public.verify_admin_auth_session(p_session_token text)
RETURNS TABLE(
  user_id uuid,
  email text,
  username text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last accessed
  UPDATE public.admin_auth_sessions 
  SET last_accessed = now()
  WHERE session_token = p_session_token AND expires_at > now();
  
  -- Return user data if session is valid
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.username,
    u.role
  FROM public.users u
  JOIN public.admin_auth_sessions s ON u.id = s.user_id
  WHERE s.session_token = p_session_token 
    AND s.expires_at > now()
    AND u.role = 'admin';
END;
$$;
