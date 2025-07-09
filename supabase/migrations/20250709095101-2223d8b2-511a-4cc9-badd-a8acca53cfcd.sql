
-- Phase 1: Enhance games table for better manual result handling
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS manual_result_set BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Phase 2: Create function to set manual game result (number only)
CREATE OR REPLACE FUNCTION public.set_manual_game_result(
  p_game_id uuid,
  p_admin_user_id uuid,
  p_result_number integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate admin user
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = p_admin_user_id AND role = 'admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Unauthorized: Admin access required'
    );
  END IF;

  -- Validate number range (0-9)
  IF p_result_number < 0 OR p_result_number > 9 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Number must be between 0 and 9'
    );
  END IF;

  -- Update game with manual result
  UPDATE public.games
  SET 
    admin_set_result_number = p_result_number,
    admin_controlled = true,
    manual_result_set = true,
    game_mode_type = 'manual',
    admin_notes = 'Manual result set by admin'
  WHERE id = p_game_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Active game not found'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Manual result set successfully',
    'result_number', p_result_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error setting manual result: ' || SQLERRM
    );
END;
$$;

-- Phase 3: Create function to complete manual game
CREATE OR REPLACE FUNCTION public.complete_manual_game(
  p_game_id uuid,
  p_admin_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_game RECORD;
  v_result_number INTEGER;
  v_result_color TEXT;
BEGIN
  -- Validate admin user
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = p_admin_user_id AND role = 'admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Unauthorized: Admin access required'
    );
  END IF;

  -- Get game details
  SELECT * INTO v_game
  FROM public.games
  WHERE id = p_game_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Active game not found'
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
      THEN 'Completed with admin-set result'
      ELSE 'Completed with random result'
    END
  WHERE id = p_game_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Game completed successfully',
    'result_number', v_result_number,
    'result_color', v_result_color,
    'was_manual', v_game.admin_set_result_number IS NOT NULL
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error completing game: ' || SQLERRM
    );
END;
$$;

-- Phase 4: Add audit logging for manual game actions
CREATE TABLE IF NOT EXISTS public.manual_game_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) NOT NULL,
  admin_user_id UUID REFERENCES public.users(id) NOT NULL,
  action TEXT NOT NULL,
  result_number INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on manual game logs
ALTER TABLE public.manual_game_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for manual game logs
CREATE POLICY "Admins can view manual game logs"
  ON public.manual_game_logs
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));
