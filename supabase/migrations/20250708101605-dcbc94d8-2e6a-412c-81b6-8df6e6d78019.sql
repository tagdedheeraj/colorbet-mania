
-- Phase 1: Create the missing generate_referral_code function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'REF' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
END;
$$;

-- Phase 2: Clean up broken admin user entries
-- Delete any existing admin entries that might be corrupted
DELETE FROM public.users WHERE email = 'admin@gameapp.com';
DELETE FROM auth.users WHERE email = 'admin@gameapp.com';

-- Phase 3: Test the trigger by creating a proper admin user
-- This will use Supabase's proper signup flow which triggers handle_new_user
-- The admin role will be set after creation
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
);

-- Phase 4: Update the newly created user to admin role
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@gameapp.com';
