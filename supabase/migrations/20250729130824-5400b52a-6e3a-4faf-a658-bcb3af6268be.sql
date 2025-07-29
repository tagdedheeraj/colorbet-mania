
-- Fix RLS policies for better admin access to users table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user balances" ON public.users;

-- Create enhanced RLS policies that check both auth context and admin sessions
CREATE POLICY "Enhanced admins can view all users" ON public.users
FOR SELECT USING (
  -- Allow users to view their own data
  (auth.uid())::text = (id)::text
  OR 
  -- Allow admin users via regular auth
  (get_user_role(auth.uid()) = 'admin'::text)
  OR
  -- Allow admin users via admin session token
  (EXISTS ( 
    SELECT 1 
    FROM admin_auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE u.role = 'admin'::text 
    AND s.expires_at > now() 
    AND u.email = 'admin@tradeforwin.xyz'::text
  ))
  OR
  -- Always allow service role
  (auth.role() = 'service_role'::text)
);

CREATE POLICY "Enhanced admins can update users" ON public.users
FOR UPDATE USING (
  -- Allow users to update their own data
  (auth.uid())::text = (id)::text
  OR 
  -- Allow admin users via regular auth
  (get_user_role(auth.uid()) = 'admin'::text)
  OR
  -- Allow admin users via admin session token
  (EXISTS ( 
    SELECT 1 
    FROM admin_auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE u.role = 'admin'::text 
    AND s.expires_at > now() 
    AND u.email = 'admin@tradeforwin.xyz'::text
  ))
  OR
  -- Always allow service role
  (auth.role() = 'service_role'::text)
);

-- Enable realtime for users table
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Add users table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
