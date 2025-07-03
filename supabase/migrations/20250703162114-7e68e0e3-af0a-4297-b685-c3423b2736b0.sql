
-- Create admin_accounts table for separate admin login system
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_accounts
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for admin accounts (only authenticated admins can view)
CREATE POLICY "Admins can view admin accounts" ON public.admin_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy for updating admin accounts (only self-update allowed)
CREATE POLICY "Admins can update own account" ON public.admin_accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to verify admin login
CREATE OR REPLACE FUNCTION public.verify_admin_login(
  p_username TEXT,
  p_password TEXT
) RETURNS TABLE (
  admin_id UUID,
  username TEXT,
  email TEXT,
  full_name TEXT,
  is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.username,
    a.email,
    a.full_name,
    a.is_active
  FROM public.admin_accounts a
  WHERE a.username = p_username 
    AND a.password_hash = crypt(p_password, a.password_hash)
    AND a.is_active = true;
END;
$$;

-- Create function to create admin account
CREATE OR REPLACE FUNCTION public.create_admin_account(
  p_username TEXT,
  p_password TEXT,
  p_email TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id UUID;
BEGIN
  INSERT INTO public.admin_accounts (username, password_hash, email, full_name)
  VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_email,
    p_full_name
  )
  RETURNING id INTO admin_id;
  
  RETURN admin_id;
END;
$$;

-- Create default admin account (username: admin, password: admin123)
SELECT public.create_admin_account('admin', 'admin123', 'admin@example.com', 'System Administrator');

-- Create admin sessions table for session management
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.admin_accounts(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for admin sessions
CREATE POLICY "Admins can manage own sessions" ON public.admin_sessions
  FOR ALL USING (true);

-- Create function to create admin session
CREATE OR REPLACE FUNCTION public.create_admin_session(
  p_admin_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_token TEXT;
BEGIN
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Insert session
  INSERT INTO public.admin_sessions (admin_id, session_token, expires_at)
  VALUES (
    p_admin_id,
    session_token,
    NOW() + INTERVAL '24 hours'
  );
  
  -- Update last login
  UPDATE public.admin_accounts 
  SET last_login = NOW(), updated_at = NOW()
  WHERE id = p_admin_id;
  
  RETURN session_token;
END;
$$;

-- Create function to verify admin session
CREATE OR REPLACE FUNCTION public.verify_admin_session(
  p_session_token TEXT
) RETURNS TABLE (
  admin_id UUID,
  username TEXT,
  email TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last accessed
  UPDATE public.admin_sessions 
  SET last_accessed = NOW()
  WHERE session_token = p_session_token AND expires_at > NOW();
  
  RETURN QUERY
  SELECT 
    a.id,
    a.username,
    a.email,
    a.full_name
  FROM public.admin_accounts a
  JOIN public.admin_sessions s ON a.id = s.admin_id
  WHERE s.session_token = p_session_token 
    AND s.expires_at > NOW()
    AND a.is_active = true;
END;
$$;

-- Create function to logout admin (delete session)
CREATE OR REPLACE FUNCTION public.logout_admin_session(
  p_session_token TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.admin_sessions 
  WHERE session_token = p_session_token;
  
  RETURN FOUND;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_accounts_username ON public.admin_accounts(username);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions(expires_at);
