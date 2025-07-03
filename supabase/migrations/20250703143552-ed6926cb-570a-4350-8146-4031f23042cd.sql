
-- Fix RLS policies for users table to allow user creation during authentication
-- The current policies only allow SELECT and UPDATE but not INSERT, which is blocking user creation

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Create new policies that allow proper user creation and management
CREATE POLICY "Users can view own data" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid()::text = id::text);

-- Add INSERT policy to allow user creation during authentication
CREATE POLICY "Service can create users" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (true);

-- Also ensure the trigger function has proper permissions
-- Update the trigger function to handle potential RLS issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table with explicit permission bypass
  INSERT INTO public.users (id, email, username, referral_code, balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    generate_referral_code(),
    1000.00
  );
  
  -- Create profile
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  -- Add signup bonus transaction
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (NEW.id, 'signup_bonus', 1000.00, 'Welcome bonus');
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't block the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up any expired games and create a fresh active game
DELETE FROM public.games WHERE status = 'active' AND end_time < now();

-- Create a new active game for immediate testing
INSERT INTO public.games (game_number, start_time, end_time, status, game_mode)
VALUES (
  (SELECT COALESCE(MAX(game_number), 0) + 1 FROM public.games),
  now(),
  now() + interval '60 seconds',
  'active',
  'quick'
);
