
-- First, let's ensure proper RLS policies for manual game operations
-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can manage games enhanced" ON public.games;
DROP POLICY IF EXISTS "Service can manage manual games" ON public.games;

-- Create comprehensive policy for admin game management
CREATE POLICY "Admins can manage all game operations" ON public.games
FOR ALL 
USING (
  -- Allow service role (for database functions)
  auth.role() = 'service_role' OR
  -- Allow authenticated admin users
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  -- Same conditions for INSERT/UPDATE
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Ensure manual_game_logs table has proper policies
DROP POLICY IF EXISTS "Admins can view manual game logs" ON public.manual_game_logs;
CREATE POLICY "Admins can manage manual game logs" ON public.manual_game_logs
FOR ALL
USING (
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create enhanced manual game result function with better error handling
CREATE OR REPLACE FUNCTION public.set_manual_game_result_enhanced(
  p_game_id uuid, 
  p_admin_user_id uuid, 
  p_result_number integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_user RECORD;
  v_game RECORD;
  v_result_color TEXT;
BEGIN
  -- Enhanced logging
  RAISE NOTICE 'Setting manual result: game_id=%, admin_user_id=%, result_number=%', 
    p_game_id, p_admin_user_id, p_result_number;

  -- Validate admin user with detailed check
  SELECT id, email, username, role INTO v_admin_user
  FROM public.users 
  WHERE id = p_admin_user_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Admin user not found: %', p_admin_user_id;
    RETURN json_build_object(
      'success', false,
      'message', 'Admin user not found in database',
      'debug_info', json_build_object('user_id', p_admin_user_id)
    );
  END IF;

  IF v_admin_user.role != 'admin' THEN
    RAISE NOTICE 'User % does not have admin role: %', p_admin_user_id, v_admin_user.role;
    RETURN json_build_object(
      'success', false,
      'message', 'User does not have admin privileges',
      'debug_info', json_build_object(
        'user_id', p_admin_user_id,
        'role', v_admin_user.role,
        'email', v_admin_user.email
      )
    );
  END IF;

  RAISE NOTICE 'Admin user validated: % (%) with role %', 
    v_admin_user.email, v_admin_user.username, v_admin_user.role;

  -- Validate number range (0-9)
  IF p_result_number < 0 OR p_result_number > 9 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Number must be between 0 and 9',
      'debug_info', json_build_object('provided_number', p_result_number)
    );
  END IF;

  -- Get and validate game
  SELECT * INTO v_game
  FROM public.games
  WHERE id = p_game_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Game not found: %', p_game_id;
    RETURN json_build_object(
      'success', false,
      'message', 'Game not found',
      'debug_info', json_build_object('game_id', p_game_id)
    );
  END IF;

  IF v_game.status != 'active' THEN
    RAISE NOTICE 'Game % is not active: %', p_game_id, v_game.status;
    RETURN json_build_object(
      'success', false,
      'message', 'Game is not active',
      'debug_info', json_build_object(
        'game_id', p_game_id,
        'game_number', v_game.game_number,
        'status', v_game.status
      )
    );
  END IF;

  RAISE NOTICE 'Game validated: #% (%) with status %', 
    v_game.game_number, p_game_id, v_game.status;

  -- Determine color based on number
  CASE 
    WHEN p_result_number IN (1, 3, 7, 9) THEN v_result_color := 'red';
    WHEN p_result_number IN (2, 4, 6, 8) THEN v_result_color := 'green';
    WHEN p_result_number IN (0, 5) THEN v_result_color := 'purple-red';
    ELSE v_result_color := 'red';
  END CASE;

  -- Update game with manual result
  UPDATE public.games
  SET 
    admin_set_result_number = p_result_number,
    admin_set_result_color = v_result_color,
    admin_controlled = true,
    manual_result_set = true,
    game_mode_type = 'manual',
    admin_notes = 'Manual result set by admin: ' || v_admin_user.email
  WHERE id = p_game_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Failed to update game: %', p_game_id;
    RETURN json_build_object(
      'success', false,
      'message', 'Failed to update game record'
    );
  END IF;

  -- Log the manual game action
  INSERT INTO public.manual_game_logs (
    admin_user_id,
    game_id,
    action,
    result_number,
    notes
  ) VALUES (
    p_admin_user_id,
    p_game_id,
    'set_manual_result',
    p_result_number,
    'Manual result set to ' || p_result_number || ' (' || v_result_color || ')'
  );

  RAISE NOTICE 'Manual result set successfully: game #%, number %, color %', 
    v_game.game_number, p_result_number, v_result_color;

  RETURN json_build_object(
    'success', true,
    'message', 'Manual result set successfully',
    'result_number', p_result_number,
    'result_color', v_result_color,
    'game_number', v_game.game_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Exception in set_manual_game_result_enhanced: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'message', 'Database error: ' || SQLERRM,
      'debug_info', json_build_object(
        'sqlstate', SQLSTATE,
        'sqlerrm', SQLERRM
      )
    );
END;
$$;
