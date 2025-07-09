
-- Fix the complete_manual_game function that's missing
CREATE OR REPLACE FUNCTION public.complete_manual_game(
  p_game_id uuid, 
  p_admin_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_user RECORD;
  v_game RECORD;
  v_result_number INTEGER;
  v_result_color TEXT;
BEGIN
  -- Enhanced logging
  RAISE NOTICE 'Completing manual game: game_id=%, admin_user_id=%', 
    p_game_id, p_admin_user_id;

  -- Validate admin user with detailed check
  SELECT id, email, username, role INTO v_admin_user
  FROM public.users 
  WHERE id = p_admin_user_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Admin user not found: %', p_admin_user_id;
    RETURN json_build_object(
      'success', false,
      'message', 'Admin user not found in database'
    );
  END IF;

  IF v_admin_user.role != 'admin' THEN
    RAISE NOTICE 'User % does not have admin role: %', p_admin_user_id, v_admin_user.role;
    RETURN json_build_object(
      'success', false,
      'message', 'User does not have admin privileges'
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
      'message', 'Game not found'
    );
  END IF;

  IF v_game.status != 'active' THEN
    RAISE NOTICE 'Game % is not active: %', p_game_id, v_game.status;
    RETURN json_build_object(
      'success', false,
      'message', 'Game is not active'
    );
  END IF;

  -- Use admin-set number if available, otherwise generate random
  IF v_game.admin_set_result_number IS NOT NULL THEN
    v_result_number := v_game.admin_set_result_number;
  ELSE
    v_result_number := floor(random() * 10)::INTEGER;
  END IF;

  -- Determine color based on number
  CASE 
    WHEN v_result_number IN (1, 3, 7, 9) THEN v_result_color := 'red';
    WHEN v_result_number IN (2, 4, 6, 8) THEN v_result_color := 'green';
    WHEN v_result_number IN (0, 5) THEN v_result_color := 'purple-red';
    ELSE v_result_color := 'red';
  END CASE;

  -- Complete the game
  UPDATE public.games
  SET 
    status = 'completed',
    result_number = v_result_number,
    result_color = v_result_color,
    end_time = now(),
    admin_notes = CASE 
      WHEN v_game.admin_set_result_number IS NOT NULL 
      THEN 'Completed with admin-set result by: ' || v_admin_user.email
      ELSE 'Completed with random result by: ' || v_admin_user.email
    END
  WHERE id = p_game_id;

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
    'complete_manual_game',
    v_result_number,
    'Game completed manually with result ' || v_result_number || ' (' || v_result_color || ')'
  );

  RAISE NOTICE 'Manual game completed successfully: game #%, number %, color %', 
    v_game.game_number, v_result_number, v_result_color;

  RETURN json_build_object(
    'success', true,
    'message', 'Game completed successfully',
    'result_number', v_result_number,
    'result_color', v_result_color,
    'was_manual', v_game.admin_set_result_number IS NOT NULL,
    'game_number', v_game.game_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Exception in complete_manual_game: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'message', 'Database error: ' || SQLERRM
    );
END;
$$;

-- Fix admin authentication context - create a proper admin context function
CREATE OR REPLACE FUNCTION public.get_current_admin_context()
RETURNS TABLE(user_id uuid, email text, username text, role text, is_authenticated boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First try to get from regular auth context
  IF auth.uid() IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.username,
      u.role,
      true as is_authenticated
    FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin';
  END IF;
  
  -- If no results, return empty but valid structure
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::uuid,
      NULL::text,
      NULL::text,
      NULL::text,
      false as is_authenticated
    WHERE FALSE;
  END IF;
END;
$$;
