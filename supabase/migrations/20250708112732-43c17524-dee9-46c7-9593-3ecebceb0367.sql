
-- Phase 1: Fix ALL auth.users NULL values globally (Critical Fix)
UPDATE auth.users 
SET 
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE 
  email_change_token_new IS NULL 
  OR email_change_token_current IS NULL 
  OR email_change_confirm_status IS NULL
  OR confirmation_token IS NULL
  OR email_change IS NULL
  OR recovery_token IS NULL;

-- Phase 2: Complete admin user cleanup and recreation
DELETE FROM public.users WHERE email = 'admin@gameapp.com';
DELETE FROM auth.users WHERE email = 'admin@gameapp.com';

-- Create admin user with ALL fields properly initialized
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_sent_at,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@gameapp.com',
  crypt('admin123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin"}',
  now(),
  now(),
  '',
  '',
  now(),
  '',
  '',
  '',
  0,
  NULL,
  NULL
);

-- Create public.users entry with admin role
INSERT INTO public.users (id, email, username, role, balance, referral_code)
SELECT 
  id,
  email,
  'admin',
  'admin',
  10000.00,
  generate_referral_code()
FROM auth.users 
WHERE email = 'admin@gameapp.com';

-- Phase 4: Create database health check function
CREATE OR REPLACE FUNCTION public.check_auth_health()
RETURNS TABLE(
  issue_type TEXT,
  issue_count INTEGER,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check for NULL email_change_token_new
  RETURN QUERY
  SELECT 
    'null_email_change_token_new'::TEXT,
    COUNT(*)::INTEGER,
    'Users with NULL email_change_token_new'::TEXT
  FROM auth.users 
  WHERE email_change_token_new IS NULL;
  
  -- Check for NULL email_change_token_current
  RETURN QUERY
  SELECT 
    'null_email_change_token_current'::TEXT,
    COUNT(*)::INTEGER,
    'Users with NULL email_change_token_current'::TEXT
  FROM auth.users 
  WHERE email_change_token_current IS NULL;
  
  -- Check for NULL email_change_confirm_status
  RETURN QUERY
  SELECT 
    'null_email_change_confirm_status'::TEXT,
    COUNT(*)::INTEGER,
    'Users with NULL email_change_confirm_status'::TEXT
  FROM auth.users 
  WHERE email_change_confirm_status IS NULL;
  
  -- Check admin user exists
  RETURN QUERY
  SELECT 
    'admin_user_exists'::TEXT,
    COUNT(*)::INTEGER,
    'Admin users in system'::TEXT
  FROM public.users 
  WHERE role = 'admin';
END;
$$;

-- Phase 5: Create fallback admin authentication table
CREATE TABLE IF NOT EXISTS public.admin_fallback_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE
);

-- Insert fallback admin
INSERT INTO public.admin_fallback_auth (username, email, password_hash)
VALUES (
  'admin',
  'admin@gameapp.com',
  crypt('admin123456', gen_salt('bf'))
) ON CONFLICT (email) DO UPDATE SET
  password_hash = crypt('admin123456', gen_salt('bf')),
  is_active = true,
  login_attempts = 0,
  locked_until = NULL;

-- Enable RLS for admin_fallback_auth
ALTER TABLE public.admin_fallback_auth ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_fallback_auth
CREATE POLICY "Service can manage admin_fallback_auth" 
ON public.admin_fallback_auth 
FOR ALL 
USING (true);
