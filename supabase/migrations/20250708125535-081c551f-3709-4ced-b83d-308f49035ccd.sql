
-- Complete cleanup and recreation of admin user
-- Phase 1: Remove all existing admin entries completely
DELETE FROM public.admin_sessions;
DELETE FROM public.users WHERE email IN ('admin@gameapp.com', 'admin@tradeforwin.xyz') OR role = 'admin';
DELETE FROM auth.users WHERE email IN ('admin@gameapp.com', 'admin@tradeforwin.xyz');

-- Phase 2: Create fresh admin user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
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
  email_change_confirm_status
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@tradeforwin.xyz',
  crypt('Trade@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  now(),
  '',
  '',
  '',
  0
);

-- Phase 3: Create corresponding public.users entry with admin role
INSERT INTO public.users (id, email, username, role, balance, referral_code)
SELECT 
  id,
  email,
  'admin',
  'admin',
  100000.00,
  generate_referral_code()
FROM auth.users 
WHERE email = 'admin@tradeforwin.xyz';

-- Phase 4: Clean up admin_sessions table structure
DROP TABLE IF EXISTS public.admin_sessions CASCADE;
CREATE TABLE public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage their own sessions
CREATE POLICY "Admin users can manage own sessions" ON public.admin_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
    AND users.id = admin_sessions.user_id
  )
);
