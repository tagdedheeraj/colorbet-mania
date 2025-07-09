

-- Create function to change admin password
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

