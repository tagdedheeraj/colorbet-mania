
-- Phase 1: Enhanced RLS policies and database improvements for deposit requests

-- First, let's enhance the approve_deposit_request function with better error handling
CREATE OR REPLACE FUNCTION public.approve_deposit_request(
  p_request_id uuid,
  p_admin_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request record;
  v_user_id uuid;
  v_amount numeric;
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Get deposit request details with validation
  SELECT * INTO v_request
  FROM public.deposit_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Deposit request not found or already processed'
    );
  END IF;
  
  v_user_id := v_request.user_id;
  v_amount := v_request.amount;
  
  -- Validate user exists
  SELECT balance INTO v_current_balance
  FROM public.users
  WHERE id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'User not found'
    );
  END IF;
  
  v_new_balance := v_current_balance + v_amount;
  
  -- Update deposit request status
  UPDATE public.deposit_requests
  SET 
    status = 'approved',
    processed_by = p_admin_id,
    processed_at = now(),
    admin_notes = p_admin_notes,
    updated_at = now()
  WHERE id = p_request_id;
  
  -- Update user balance
  UPDATE public.users
  SET 
    balance = v_new_balance,
    updated_at = now()
  WHERE id = v_user_id;
  
  -- Create transaction record
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    description,
    status,
    payment_method,
    transaction_reference
  ) VALUES (
    v_user_id,
    'deposit',
    v_amount,
    'Deposit approved - Transaction ID: ' || v_request.transaction_id,
    'completed',
    v_request.payment_method,
    v_request.transaction_id
  );
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Deposit approved successfully',
    'new_balance', v_new_balance,
    'amount', v_amount,
    'user_id', v_user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Error processing deposit: ' || SQLERRM
    );
END;
$$;

-- Enhanced reject_deposit_request function
CREATE OR REPLACE FUNCTION public.reject_deposit_request(
  p_request_id uuid,
  p_admin_id uuid,
  p_admin_notes text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update deposit request status
  UPDATE public.deposit_requests
  SET 
    status = 'rejected',
    processed_by = p_admin_id,
    processed_at = now(),
    admin_notes = p_admin_notes,
    updated_at = now()
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Deposit request not found or already processed'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Deposit request rejected successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Error rejecting deposit: ' || SQLERRM
    );
END;
$$;

-- Enhanced RLS policy for deposit_requests that works with admin session system
DROP POLICY IF EXISTS "Enhanced admins can view all deposit requests" ON public.deposit_requests;
CREATE POLICY "Enhanced admins can view all deposit requests"
  ON public.deposit_requests
  FOR SELECT
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
  );

-- Enhanced RLS policy for deposit_requests updates
DROP POLICY IF EXISTS "Enhanced admins can update deposit requests" ON public.deposit_requests;
CREATE POLICY "Enhanced admins can update deposit requests"
  ON public.deposit_requests
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
  );

-- Enable realtime for deposit_requests table
ALTER TABLE public.deposit_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_requests;
