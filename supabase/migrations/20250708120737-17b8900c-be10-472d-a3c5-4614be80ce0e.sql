
-- Phase 1: Fix the persistent NULL values in auth.users table
-- Update all NULL email_change_token fields to empty strings to prevent scan errors
UPDATE auth.users 
SET 
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  recovery_token = COALESCE(recovery_token, ''),
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, '')
WHERE 
  email_change_token_new IS NULL 
  OR email_change_token_current IS NULL 
  OR email_change_confirm_status IS NULL
  OR recovery_token IS NULL
  OR confirmation_token IS NULL
  OR email_change IS NULL;

-- Clean up any corrupted admin entries and recreate properly
DELETE FROM public.users WHERE email = 'admin@gameapp.com';
DELETE FROM auth.users WHERE email = 'admin@gameapp.com';

-- Create a fresh, properly formatted admin user
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
