
-- Create deposit requests table
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('upi', 'qr_code', 'net_banking')),
  transaction_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  processed_by uuid REFERENCES public.users(id),
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposit requests
CREATE POLICY "Users can view own deposit requests"
  ON public.deposit_requests
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own deposit requests
CREATE POLICY "Users can create deposit requests"
  ON public.deposit_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all deposit requests
CREATE POLICY "Admins can view all deposit requests"
  ON public.deposit_requests
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admins can update deposit requests
CREATE POLICY "Admins can update deposit requests"
  ON public.deposit_requests
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Service role can manage all deposit requests
CREATE POLICY "Service role can manage deposit requests"
  ON public.deposit_requests
  FOR ALL
  USING (true);

-- Add payment gateway details table
CREATE TABLE IF NOT EXISTS public.payment_gateway_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_type text NOT NULL,
  config_data jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default payment gateway configurations
INSERT INTO public.payment_gateway_config (gateway_type, config_data) VALUES
('upi', '{"upi_id": "admin@paytm", "merchant_name": "Game Hub"}'),
('qr_code', '{"qr_image_url": "https://via.placeholder.com/200x200/000000/FFFFFF?text=QR+Code", "merchant_name": "Game Hub"}'),
('net_banking', '{"bank_name": "State Bank of India", "account_number": "1234567890", "ifsc": "SBIN0001234", "account_holder": "Game Hub"}')
ON CONFLICT DO NOTHING;

-- Enable RLS on payment gateway config
ALTER TABLE public.payment_gateway_config ENABLE ROW LEVEL SECURITY;

-- Anyone can view payment gateway configs (for public display)
CREATE POLICY "Anyone can view payment configs"
  ON public.payment_gateway_config
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage payment configs
CREATE POLICY "Admins can manage payment configs"
  ON public.payment_gateway_config
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Function to process deposit approval
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
BEGIN
  -- Get deposit request details
  SELECT * INTO v_request
  FROM public.deposit_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Deposit request not found or already processed');
  END IF;
  
  v_user_id := v_request.user_id;
  v_amount := v_request.amount;
  
  -- Get current user balance
  SELECT balance INTO v_current_balance
  FROM public.users
  WHERE id = v_user_id;
  
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
    balance = balance + v_amount,
    updated_at = now()
  WHERE id = v_user_id;
  
  -- Create transaction record
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    description,
    status
  ) VALUES (
    v_user_id,
    'deposit',
    v_amount,
    'Deposit approved - Transaction ID: ' || v_request.transaction_id,
    'completed'
  );
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Deposit approved successfully',
    'new_balance', v_current_balance + v_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Error processing deposit: ' || SQLERRM);
END;
$$;

-- Function to reject deposit request
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
    RETURN json_build_object('success', false, 'message', 'Deposit request not found or already processed');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Deposit request rejected');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Error rejecting deposit: ' || SQLERRM);
END;
$$;
