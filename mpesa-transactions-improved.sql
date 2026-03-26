-- ============================================
-- M-Pesa Transactions Table - Improved Schema
-- ============================================
-- Migration for enhanced M-Pesa transaction tracking
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ============================================

-- Drop existing table and dependencies if they exist
DROP TABLE IF EXISTS mpesa_transactions CASCADE;
DROP VIEW IF EXISTS mpesa_transaction_summary CASCADE;

-- Create M-Pesa Transactions Table with enhanced fields
CREATE TABLE mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference fields
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- M-Pesa identifiers
  checkout_request_id TEXT UNIQUE NOT NULL,
  merchant_request_id TEXT,
  
  -- Transaction details
  phone_number TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  account_reference TEXT,
  transaction_desc TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'failed', 'timeout')),
  result_code TEXT,
  result_desc TEXT,
  
  -- M-Pesa response data
  mpesa_receipt_number TEXT,
  transaction_date TIMESTAMPTZ,
  
  -- Additional metadata (JSONB for flexible storage)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT
);

-- Add table comment
COMMENT ON TABLE mpesa_transactions IS 'Stores M-Pesa STK Push payment transactions with enhanced tracking and audit fields';

-- Add column comments
COMMENT ON COLUMN mpesa_transactions.checkout_request_id IS 'Unique ID from M-Pesa STK Push request (CheckoutRequestID)';
COMMENT ON COLUMN mpesa_transactions.merchant_request_id IS 'Merchant request ID from M-Pesa (MerchantRequestID)';
COMMENT ON COLUMN mpesa_transactions.status IS 'Transaction status: pending, processing, completed, cancelled, failed, timeout';
COMMENT ON COLUMN mpesa_transactions.result_code IS 'M-Pesa result code (0 = success, others = various errors)';
COMMENT ON COLUMN mpesa_transactions.result_desc IS 'M-Pesa result description';
COMMENT ON COLUMN mpesa_transactions.mpesa_receipt_number IS 'M-Pesa receipt number for successful transactions';
COMMENT ON COLUMN mpesa_transactions.transaction_date IS 'Date and time of transaction from M-Pesa';
COMMENT ON COLUMN mpesa_transactions.metadata IS 'Additional transaction metadata in JSON format';
COMMENT ON COLUMN mpesa_transactions.retry_count IS 'Number of retry attempts for status queries';
COMMENT ON COLUMN mpesa_transactions.account_reference IS 'Account reference used for the transaction';
COMMENT ON COLUMN mpesa_transactions.transaction_desc IS 'Transaction description sent to M-Pesa';

-- Create comprehensive indexes for faster lookups
CREATE INDEX idx_mpesa_checkout_request ON mpesa_transactions(checkout_request_id);
CREATE INDEX idx_mpesa_order ON mpesa_transactions(order_id);
CREATE INDEX idx_mpesa_user ON mpesa_transactions(user_id);
CREATE INDEX idx_mpesa_status ON mpesa_transactions(status);
CREATE INDEX idx_mpesa_created_at ON mpesa_transactions(created_at);
CREATE INDEX idx_mpesa_updated_at ON mpesa_transactions(updated_at);
CREATE INDEX idx_mpesa_result_code ON mpesa_transactions(result_code);
CREATE INDEX idx_mpesa_phone ON mpesa_transactions(phone_number);
CREATE INDEX idx_mpesa_receipt ON mpesa_transactions(mpesa_receipt_number);
CREATE INDEX idx_mpesa_status_created ON mpesa_transactions(status, created_at);
CREATE INDEX idx_mpesa_user_status ON mpesa_transactions(user_id, status);

-- Create index on metadata for JSON queries (if needed)
CREATE INDEX idx_mpesa_metadata ON mpesa_transactions USING GIN (metadata);

-- Enable Row Level Security (RLS)
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON mpesa_transactions
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = created_by);

-- Policy: Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access"
ON mpesa_transactions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- Policy: Allow insert for authenticated users
CREATE POLICY "Users can create transactions"
ON mpesa_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = created_by);

-- Policy: Allow service role to update all transactions
CREATE POLICY "Service role can update all transactions"
ON mpesa_transactions
FOR UPDATE
USING (auth.jwt()->>'role' = 'service_role');

-- Policy: Allow insert for service role (Edge Functions)
CREATE POLICY "Service role can create transactions"
ON mpesa_transactions
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- Grant permissions
-- ============================================
GRANT SELECT ON mpesa_transactions TO authenticated;
GRANT INSERT ON mpesa_transactions TO authenticated;

-- ============================================
-- Create views for analytics
-- ============================================

-- Transaction summary view
CREATE OR REPLACE VIEW mpesa_transaction_summary AS
SELECT
  DATE(created_at) as transaction_date,
  status,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as average_amount
FROM mpesa_transactions
GROUP BY DATE(created_at), status
ORDER BY transaction_date DESC;

-- Daily transaction stats view
CREATE OR REPLACE VIEW mpesa_daily_stats AS
SELECT
  DATE(created_at) as transaction_date,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_transactions,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_transactions,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_transactions,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_transactions,
  SUM(amount) FILTER (WHERE status = 'completed') as successful_amount,
  AVG(amount) FILTER (WHERE status = 'completed') as average_successful_amount,
  COUNT(DISTINCT user_id) as unique_customers,
  COUNT(DISTINCT phone_number) as unique_phones
FROM mpesa_transactions
GROUP BY DATE(created_at)
ORDER BY transaction_date DESC;

-- Monthly transaction stats view
CREATE OR REPLACE VIEW mpesa_monthly_stats AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_transactions,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_transactions,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_transactions,
  SUM(amount) FILTER (WHERE status = 'completed') as successful_amount,
  AVG(amount) FILTER (WHERE status = 'completed') as average_successful_amount,
  COUNT(DISTINCT user_id) as unique_customers,
  COUNT(DISTINCT phone_number) as unique_phones
FROM mpesa_transactions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Grant access to views
GRANT SELECT ON mpesa_transaction_summary TO authenticated;
GRANT SELECT ON mpesa_daily_stats TO authenticated;
GRANT SELECT ON mpesa_monthly_stats TO authenticated;

-- ============================================
-- Create function to get transaction by checkout request ID
-- ============================================
CREATE OR REPLACE FUNCTION get_mpesa_transaction(p_checkout_request_id TEXT)
RETURNS TABLE (
  id UUID,
  order_id UUID,
  user_id UUID,
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  phone_number TEXT,
  amount DECIMAL,
  status TEXT,
  result_code TEXT,
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  transaction_date TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.order_id,
    t.user_id,
    t.checkout_request_id,
    t.merchant_request_id,
    t.phone_number,
    t.amount,
    t.status,
    t.result_code,
    t.result_desc,
    t.mpesa_receipt_number,
    t.transaction_date,
    t.metadata,
    t.created_at,
    t.updated_at
  FROM mpesa_transactions t
  WHERE t.checkout_request_id = p_checkout_request_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_mpesa_transaction(TEXT) TO authenticated;

-- ============================================
-- Create function to update transaction status
-- ============================================
CREATE OR REPLACE FUNCTION update_mpesa_transaction_status(
  p_checkout_request_id TEXT,
  p_status TEXT,
  p_result_code TEXT DEFAULT NULL,
  p_result_desc TEXT DEFAULT NULL,
  p_mpesa_receipt_number TEXT DEFAULT NULL,
  p_transaction_date TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE mpesa_transactions
  SET
    status = p_status,
    result_code = COALESCE(p_result_code, result_code),
    result_desc = COALESCE(p_result_desc, result_desc),
    mpesa_receipt_number = COALESCE(p_mpesa_receipt_number, mpesa_receipt_number),
    transaction_date = COALESCE(p_transaction_date, transaction_date),
    metadata = COALESCE(p_metadata, metadata),
    updated_at = NOW()
  WHERE checkout_request_id = p_checkout_request_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_mpesa_transaction_status(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB) TO authenticated;

-- ============================================
-- Create trigger to auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_mpesa_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_mpesa_transactions_updated_at
BEFORE UPDATE ON mpesa_transactions
FOR EACH ROW
EXECUTE FUNCTION update_mpesa_transactions_updated_at();

-- ============================================
-- Sample M-Pesa Result Codes Reference
-- ============================================
-- 0: Success
-- 1001: Insufficient Funds
-- 1002: Less than minimum transaction value
-- 1003: More than maximum transaction value
-- 1004/1005: Would exceed daily transfer limit
-- 1006: Customer has not opted for the service
-- 1007: Invalid transaction
-- 1008: Invalid phone number
-- 1010: Timeout waiting for customer input
-- 1011: Customer rejected the transaction
-- 1012: Customer entered wrong PIN
-- 1014: Request cancelled by user
-- 1016: System busy
-- 1017: Duplicate request

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify table creation
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'mpesa_transactions'
ORDER BY ordinal_position;

-- ============================================
-- Test Data (Optional - for development only)
-- ============================================
-- Uncomment to insert test data
/*
INSERT INTO mpesa_transactions (
  checkout_request_id,
  merchant_request_id,
  phone_number,
  amount,
  status,
  result_code,
  result_desc,
  mpesa_receipt_number,
  transaction_date,
  account_reference,
  transaction_desc
) VALUES
(
  'ws_CO_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  '12345',
  '254708374149',
  100.00,
  'completed',
  '0',
  'The service request is processed successfully.',
  'QFH4D7V2KL',
  NOW(),
  'ORDER-001',
  'Test payment for order'
),
(
  'ws_CO_' || (EXTRACT(EPOCH FROM NOW()) - 100)::TEXT,
  '12346',
  '254708374150',
  500.00,
  'cancelled',
  '1014',
  'Request cancelled by user',
  NULL,
  NULL,
  'ORDER-002',
  'Cancelled test payment'
),
(
  'ws_CO_' || (EXTRACT(EPOCH FROM NOW()) - 200)::TEXT,
  '12347',
  '254708374151',
  250.00,
  'failed',
  '1001',
  'Insufficient funds',
  NULL,
  NULL,
  'ORDER-003',
  'Failed test payment'
);
*/
