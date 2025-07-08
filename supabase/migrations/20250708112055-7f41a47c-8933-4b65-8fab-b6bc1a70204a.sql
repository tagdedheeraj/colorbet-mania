
-- Fix the NULL values in auth.users table that are causing login failures
UPDATE auth.users 
SET 
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0)
WHERE 
  email_change_token_new IS NULL 
  OR email_change_token_current IS NULL 
  OR email_change_confirm_status IS NULL;

-- Clean up any corrupted admin user entries
DELETE FROM public.users WHERE email = 'admin@gameapp.com';
DELETE FROM auth.users WHERE email = 'admin@gameapp.com';

-- Create a fresh admin user with all required fields properly set
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
  '',
  '',
  '',
  0
);

-- Create the corresponding public.users entry with admin role
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
