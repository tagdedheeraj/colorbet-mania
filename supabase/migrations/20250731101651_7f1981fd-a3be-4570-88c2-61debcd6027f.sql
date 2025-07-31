
-- Create enhanced database functions and improve manual game handling
-- Add additional columns for better manual game state tracking

-- Add new columns to games table for better manual control
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS manual_mode_enabled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS manual_completion_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS timer_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_override_timer BOOLEAN DEFAULT FALSE;

-- Create enhanced function for setting manual mode with timer control
CREATE OR REPLACE FUNCTION public.set_manual_mode_enhanced(
    p_game_id uuid, 
    p_admin_user_id uuid, 
    p_enable_manual boolean
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_user RECORD;
    v_game RECORD;
BEGIN
    -- Validate admin user
    SELECT id, email, username, role INTO v_admin_user
    FROM public.users 
    WHERE id = p_admin_user_id AND role = 'admin';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Admin user not found or invalid permissions'
        );
    END IF;

    -- Get and validate game
    SELECT * INTO v_game
    FROM public.games
    WHERE id = p_game_id AND status = 'active';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Active game not found'
        );
    END IF;

    -- Update game with manual mode settings
    UPDATE public.games
    SET 
        game_mode_type = CASE WHEN p_enable_manual THEN 'manual' ELSE 'automatic' END,
        admin_controlled = p_enable_manual,
        manual_mode_enabled_at = CASE WHEN p_enable_manual THEN now() ELSE NULL END,
        manual_completion_required = p_enable_manual,
        timer_paused = p_enable_manual,
        admin_override_timer = p_enable_manual,
        admin_notes = CASE 
            WHEN p_enable_manual THEN 'Manual mode enabled by: ' || v_admin_user.email || ' at ' || now()
            ELSE 'Manual mode disabled by: ' || v_admin_user.email || ' at ' || now()
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
        CASE WHEN p_enable_manual THEN 'enable_manual_mode' ELSE 'disable_manual_mode' END,
        json_build_object(
            'game_id', p_game_id,
            'game_number', v_game.game_number,
            'manual_enabled', p_enable_manual,
            'admin_email', v_admin_user.email,
            'timestamp', now()
        ),
        p_game_id,
        'game'
    );

    RETURN json_build_object(
        'success', true,
        'message', CASE 
            WHEN p_enable_manual THEN 'Manual mode enabled successfully'
            ELSE 'Manual mode disabled successfully'
        END,
        'manual_enabled', p_enable_manual,
        'game_number', v_game.game_number,
        'timer_paused', p_enable_manual
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Database error: ' || SQLERRM
        );
END;
$$;

-- Create function to check if game is in manual mode
CREATE OR REPLACE FUNCTION public.is_game_manual(p_game_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT COALESCE(admin_controlled, false) AND COALESCE(timer_paused, false)
    FROM public.games 
    WHERE id = p_game_id AND status = 'active';
$$;

-- Enhanced manual game result function with better validation
CREATE OR REPLACE FUNCTION public.set_manual_result_enhanced(
    p_game_id uuid, 
    p_admin_user_id uuid, 
    p_result_number integer
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_user RECORD;
    v_game RECORD;
    v_result_color TEXT;
BEGIN
    -- Validate admin user
    SELECT id, email, username, role INTO v_admin_user
    FROM public.users 
    WHERE id = p_admin_user_id AND role = 'admin';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Admin user not found or invalid permissions'
        );
    END IF;

    -- Validate number range
    IF p_result_number < 0 OR p_result_number > 9 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Number must be between 0 and 9'
        );
    END IF;

    -- Get and validate game
    SELECT * INTO v_game
    FROM public.games
    WHERE id = p_game_id AND status = 'active';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Active game not found'
        );
    END IF;

    -- Check if game is in manual mode
    IF NOT COALESCE(v_game.admin_controlled, false) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Game must be in manual mode to set result'
        );
    END IF;

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
        manual_result_set = true,
        admin_notes = 'Manual result set by: ' || v_admin_user.email || ' - Number: ' || p_result_number || ' Color: ' || v_result_color
    WHERE id = p_game_id;

    -- Log the manual result setting
    INSERT INTO public.manual_game_logs (
        admin_user_id,
        game_id,
        action,
        result_number,
        notes
    ) VALUES (
        p_admin_user_id,
        p_game_id,
        'set_manual_result_enhanced',
        p_result_number,
        'Enhanced manual result set: ' || p_result_number || ' (' || v_result_color || ')'
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Manual result set successfully',
        'result_number', p_result_number,
        'result_color', v_result_color,
        'game_number', v_game.game_number,
        'timer_paused', COALESCE(v_game.timer_paused, false)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Database error: ' || SQLERRM
        );
END;
$$;

-- Enhanced manual completion function
CREATE OR REPLACE FUNCTION public.complete_manual_game_enhanced(
    p_game_id uuid, 
    p_admin_user_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_user RECORD;
    v_game RECORD;
    v_result_number INTEGER;
    v_result_color TEXT;
BEGIN
    -- Validate admin user
    SELECT id, email, username, role INTO v_admin_user
    FROM public.users 
    WHERE id = p_admin_user_id AND role = 'admin';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Admin user not found or invalid permissions'
        );
    END IF;

    -- Get and validate game
    SELECT * INTO v_game
    FROM public.games
    WHERE id = p_game_id AND status = 'active';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Active game not found'
        );
    END IF;

    -- Check if manual result is set
    IF NOT COALESCE(v_game.manual_result_set, false) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Manual result must be set before completing game'
        );
    END IF;

    -- Use admin-set result
    v_result_number := v_game.admin_set_result_number;
    v_result_color := v_game.admin_set_result_color;

    -- Complete the game with manual result
    UPDATE public.games
    SET 
        status = 'completed',
        result_number = v_result_number,
        result_color = v_result_color,
        end_time = now(),
        admin_notes = 'Manually completed by: ' || v_admin_user.email || ' with result: ' || v_result_number || ' (' || v_result_color || ')'
    WHERE id = p_game_id;

    -- Log manual completion
    INSERT INTO public.manual_game_logs (
        admin_user_id,
        game_id,
        action,
        result_number,
        notes
    ) VALUES (
        p_admin_user_id,
        p_game_id,
        'complete_manual_game_enhanced',
        v_result_number,
        'Game manually completed with result: ' || v_result_number || ' (' || v_result_color || ')'
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Game completed successfully',
        'result_number', v_result_number,
        'result_color', v_result_color,
        'game_number', v_game.game_number,
        'was_manual', true
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Database error: ' || SQLERRM
        );
END;
$$;
