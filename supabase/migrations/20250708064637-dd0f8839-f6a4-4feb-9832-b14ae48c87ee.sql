
-- Phase 1: Clean up corrupted auth.users entry
-- Delete the manually inserted admin user that's causing schema errors
DELETE FROM auth.users WHERE email = 'admin@gameapp.com';

-- Also clean up corresponding public.users entry
DELETE FROM public.users WHERE email = 'admin@gameapp.com';

-- Phase 2: Fix auth.users table structure if needed
-- Ensure all auth.users columns have proper defaults to prevent NULL conversion errors
UPDATE auth.users 
SET 
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0)
WHERE 
  email_change_token_new IS NULL 
  OR email_change_token_current IS NULL 
  OR email_change_confirm_status IS NULL;
