
-- First, drop existing functions and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.generate_referral_code();

-- Create function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'REF' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, username, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    generate_referral_code()
  );
  
  -- Create profile
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  -- Add signup bonus transaction
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (NEW.id, 'signup_bonus', 1000.00, 'Welcome bonus');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test the function by selecting it (this will verify it exists)
SELECT public.generate_referral_code();
