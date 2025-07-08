
-- Phase 1: Fix Critical RLS Policies to prevent infinite recursion

-- Create security definer function to safely check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Drop existing problematic policies on users table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user balances" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Create new policies using security definer function
CREATE POLICY "Users can view own data" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" 
  ON public.users 
  FOR SELECT 
  USING (
    auth.uid()::text = id::text OR 
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update user balances" 
  ON public.users 
  FOR UPDATE 
  USING (
    auth.uid()::text = id::text OR 
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Phase 2: Create a proper admin user
-- Insert admin user (you can change email/password as needed)
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
  recovery_token
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
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  now(),
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding user record with admin role
INSERT INTO public.users (id, email, username, role, balance)
SELECT 
  id,
  email,
  'admin',
  'admin',
  10000.00
FROM auth.users 
WHERE email = 'admin@gameapp.com'
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  username = 'admin';

-- Phase 4: Clean up games - remove multiple active games
UPDATE public.games 
SET status = 'completed', 
    end_time = now()
WHERE status = 'active' AND end_time < now();

-- Keep only the most recent active game if multiple exist
WITH ranked_games AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM public.games 
  WHERE status = 'active'
)
UPDATE public.games 
SET status = 'completed', end_time = now()
WHERE id IN (
  SELECT id FROM ranked_games WHERE rn > 1
);
