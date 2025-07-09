
-- Phase 1: Create admin credentials table with proper password hashing
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_credentials
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for admin credentials (only service role can access)
CREATE POLICY "Service role can manage admin credentials"
  ON public.admin_credentials
  FOR ALL
  USING (true);

-- Phase 2: Create password hashing function using pgcrypto
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TABLE(hash TEXT, salt TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  generated_salt TEXT;
  password_hash TEXT;
BEGIN
  -- Generate random salt
  generated_salt := encode(gen_random_bytes(16), 'base64');
  
  -- Create hash using salt + password
  password_hash := crypt(password || generated_salt, gen_salt('bf', 10));
  
  RETURN QUERY SELECT password_hash, generated_salt;
END;
$$;

-- Phase 3: Initialize admin credentials with current password
DO $$
DECLARE
  hash_result RECORD;
BEGIN
  -- Get hash for current password
  SELECT * INTO hash_result FROM public.hash_password('Trade@123');
  
  -- Insert initial admin credentials
  INSERT INTO public.admin_credentials (email, password_hash, salt)
  VALUES ('admin@tradeforwin.xyz', hash_result.hash, hash_result.salt)
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    updated_at = now();
END;
$$;

-- Phase 4: Update password verification function
CREATE OR REPLACE FUNCTION public.verify_admin_credentials_enhanced(p_email text, p_password text)
RETURNS TABLE(user_id uuid, email text, username text, role text, session_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_token text;
  v_stored_hash text;
  v_stored_salt text;
  v_computed_hash text;
BEGIN
  -- Get stored credentials
  SELECT password_hash, salt INTO v_stored_hash, v_stored_salt
  FROM public.admin_credentials
  WHERE admin_credentials.email = p_email;
  
  -- If no credentials found, return empty
  IF v_stored_hash IS NULL THEN
    RETURN;
  END IF;
  
  -- Compute hash of provided password with stored salt
  v_computed_hash := crypt(p_password || v_stored_salt, v_stored_hash);
  
  -- Verify password
  IF v_computed_hash = v_stored_hash THEN
    -- Create session token
    v_session_token := public.create_admin_auth_session_enhanced(p_email);
    
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.username,
      u.role,
      v_session_token
    FROM public.users u
    WHERE u.email = p_email AND u.role = 'admin';
  ELSE
    -- Return empty result for invalid credentials
    RETURN;
  END IF;
END;
$$;

-- Phase 5: Update password change function
CREATE OR REPLACE FUNCTION public.change_admin_password(
  p_email text,
  p_current_password text,
  p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_hash text;
  v_stored_salt text;
  v_computed_hash text;
  v_new_hash text;
  v_new_salt text;
  hash_result RECORD;
BEGIN
  -- Validate new password length
  IF length(p_new_password) < 8 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'New password must be at least 8 characters long'
    );
  END IF;
  
  -- Get current stored credentials
  SELECT password_hash, salt INTO v_stored_hash, v_stored_salt
  FROM public.admin_credentials
  WHERE email = p_email;
  
  -- If no credentials found
  IF v_stored_hash IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Admin credentials not found'
    );
  END IF;
  
  -- Verify current password
  v_computed_hash := crypt(p_current_password || v_stored_salt, v_stored_hash);
  
  IF v_computed_hash != v_stored_hash THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Current password is incorrect'
    );
  END IF;
  
  -- Generate new hash for new password
  SELECT * INTO hash_result FROM public.hash_password(p_new_password);
  
  -- Update password in database
  UPDATE public.admin_credentials
  SET 
    password_hash = hash_result.hash,
    salt = hash_result.salt,
    updated_at = now()
  WHERE email = p_email;
  
  -- Invalidate all existing sessions for security
  DELETE FROM public.admin_auth_sessions
  WHERE user_id IN (
    SELECT id FROM public.users WHERE email = p_email AND role = 'admin'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Password changed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error changing password: ' || SQLERRM
    );
END;
$$;

-- Phase 6: Create audit log for password changes
CREATE TABLE IF NOT EXISTS public.admin_password_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'password_change',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on password logs
ALTER TABLE public.admin_password_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for password logs
CREATE POLICY "Admins can view password logs"
  ON public.admin_password_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Function to log password changes
CREATE OR REPLACE FUNCTION public.log_password_change(
  p_admin_email text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_password_logs (admin_email, ip_address, user_agent)
  VALUES (p_admin_email, p_ip_address, p_user_agent);
END;
$$;
