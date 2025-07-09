
-- Phase 1: Create enhanced admin session validation function
CREATE OR REPLACE FUNCTION public.validate_admin_session_enhanced(p_session_token text)
RETURNS TABLE(user_id uuid, email text, username text, role text, is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last accessed for valid sessions
  UPDATE public.admin_auth_sessions 
  SET last_accessed = now()
  WHERE session_token = p_session_token AND expires_at > now();
  
  -- Return user data if session is valid and user has admin role
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.username,
    u.role,
    true as is_valid
  FROM public.users u
  JOIN public.admin_auth_sessions s ON u.id = s.user_id
  WHERE s.session_token = p_session_token 
    AND s.expires_at > now()
    AND u.role = 'admin';
    
  -- Return invalid result if no valid session found
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::uuid,
      NULL::text,
      NULL::text,
      NULL::text,
      false as is_valid
    WHERE FALSE;
  END IF;
END;
$$;

-- Phase 2: Create enhanced game mode setting function
CREATE OR REPLACE FUNCTION public.set_game_mode_enhanced(
  p_game_id uuid,
  p_admin_user_id uuid,
  p_mode text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_user RECORD;
  v_game RECORD;
BEGIN
  -- Enhanced logging
  RAISE NOTICE 'Setting game mode: game_id=%, admin_user_id=%, mode=%', 
    p_game_id, p_admin_user_id, p_mode;

  -- Validate admin user
  SELECT id, email, username, role INTO v_admin_user
  FROM public.users 
  WHERE id = p_admin_user_id AND role = 'admin';
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Admin user not found or invalid role: %', p_admin_user_id;
    RETURN json_build_object(
      'success', false,
      'message', 'Admin user not found or invalid permissions'
    );
  END IF;

  -- Validate mode
  IF p_mode NOT IN ('manual', 'automatic') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid game mode. Must be manual or automatic'
    );
  END IF;

  -- Get and validate game
  SELECT * INTO v_game
  FROM public.games
  WHERE id = p_game_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE NOTICE 'Active game not found: %', p_game_id;
    RETURN json_build_object(
      'success', false,
      'message', 'Active game not found'
    );
  END IF;

  -- Update game mode
  UPDATE public.games
  SET 
    game_mode_type = p_mode,
    admin_controlled = (p_mode = 'manual'),
    admin_notes = CASE 
      WHEN p_mode = 'manual' THEN 'Game set to manual mode by: ' || v_admin_user.email
      ELSE 'Game set to automatic mode by: ' || v_admin_user.email
    END
  WHERE id = p_game_id;

  -- Log the action
  INSERT INTO public.admin_logs (
    admin_user_id,
    action,
    details,
    target_id,
    target_type
  ) VALUES (
    p_admin_user_id,
    'set_game_mode',
    json_build_object(
      'game_id', p_game_id,
      'game_number', v_game.game_number,
      'mode', p_mode,
      'admin_email', v_admin_user.email
    ),
    p_game_id,
    'game'
  );

  RAISE NOTICE 'Game mode set successfully: game #%, mode %', 
    v_game.game_number, p_mode;

  RETURN json_build_object(
    'success', true,
    'message', 'Game mode set successfully',
    'mode', p_mode,
    'game_number', v_game.game_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Exception in set_game_mode_enhanced: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'message', 'Database error: ' || SQLERRM
    );
END;
$$;

-- Phase 3: Enhanced RLS policies for games table with admin session support
DROP POLICY IF EXISTS "Enhanced admins can manage games" ON public.games;
CREATE POLICY "Enhanced admins can manage games"
  ON public.games
  FOR UPDATE
  USING (
    -- Allow if user is admin via users table
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Allow if user has valid admin session via our custom auth
    EXISTS (
      SELECT 1 FROM public.admin_auth_sessions s
      JOIN public.users u ON u.id = s.user_id
      WHERE u.role = 'admin' 
        AND s.expires_at > now()
        AND u.email = 'admin@tradeforwin.xyz'
    )
    OR
    -- Allow service role
    auth.role() = 'service_role'
  )
  WITH CHECK (
    -- Same conditions for updates
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.admin_auth_sessions s
      JOIN public.users u ON u.id = s.user_id
      WHERE u.role = 'admin' 
        AND s.expires_at > now()
        AND u.email = 'admin@tradeforwin.xyz'
    )
    OR
    auth.role() = 'service_role'
  );
