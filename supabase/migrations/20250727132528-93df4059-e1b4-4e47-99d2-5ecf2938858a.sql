
-- Remove the signup bonus from new users by updating the default balance
ALTER TABLE public.users ALTER COLUMN balance SET DEFAULT 0.00;

-- Update the handle_new_user function to not give signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into users table without signup bonus
  INSERT INTO public.users (id, email, username, referral_code, balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    generate_referral_code(),
    0.00  -- No signup bonus
  );
  
  -- Create profile
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  -- No signup bonus transaction
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't block the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Update existing UserCreationService and UserSyncService to not give signup bonus
-- This will be handled in the code changes
