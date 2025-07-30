
-- First, let's check if admin credentials exist and update them with the correct password
-- We'll use the enhanced authentication system with proper password hashing

-- Delete existing admin credentials if any
DELETE FROM public.admin_credentials WHERE email = 'admin@tradeforwin.xyz';

-- Insert the correct admin credentials with properly hashed password for 'Trade@123'
DO $$
DECLARE
  hash_result RECORD;
BEGIN
  -- Generate hash for the password 'Trade@123'
  SELECT * INTO hash_result FROM public.hash_password('Trade@123');
  
  -- Insert admin credentials
  INSERT INTO public.admin_credentials (email, password_hash, salt, created_at, updated_at)
  VALUES (
    'admin@tradeforwin.xyz',
    hash_result.hash,
    hash_result.salt,
    now(),
    now()
  );
END $$;

-- Also ensure the admin user exists in the users table with correct role
INSERT INTO public.users (id, email, username, role, balance, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@tradeforwin.xyz',
  'admin',
  'admin',
  0,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  username = 'admin',
  updated_at = now();
