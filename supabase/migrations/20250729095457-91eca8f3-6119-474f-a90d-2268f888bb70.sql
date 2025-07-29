
-- Update the handle_new_user function to give 50rs signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into users table with 50rs signup bonus
  INSERT INTO public.users (id, email, username, referral_code, balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    generate_referral_code(),
    50.00  -- 50rs signup bonus
  );
  
  -- Create profile
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  -- Create signup bonus transaction
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    description,
    status
  ) VALUES (
    NEW.id,
    'bonus',
    50.00,
    'Welcome bonus - Thank you for joining!',
    'completed'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't block the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Update the default balance for new users
ALTER TABLE public.users ALTER COLUMN balance SET DEFAULT 50.00;
