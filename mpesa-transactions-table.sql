-- ============================================
-- M-Pesa Transactions Table Setup
-- ============================================
-- Run this SQL in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ============================================

-- Drop existing table if it exists (for fresh setup)
DROP TABLE IF EXISTS mpesa_transactions CASCADE;

-- Create M-Pesa Transactions Table
CREATE TABLE mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checkout_request_id TEXT UNIQUE,
  merchant_request_id TEXT,
  phone_number TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  result_code TEXT,
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  transaction_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_mpesa_checkout_request ON mpesa_transactions(checkout_request_id);
CREATE INDEX idx_mpesa_order ON mpesa_transactions(order_id);
CREATE INDEX idx_mpesa_customer ON mpesa_transactions(customer_id);
CREATE INDEX idx_mpesa_status ON mpesa_transactions(status);
CREATE INDEX idx_mpesa_created_at ON mpesa_transactions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON mpesa_transactions
FOR SELECT
USING (auth.uid() = customer_id);

-- Policy: Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access"
ON mpesa_transactions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- Policy: Allow insert for authenticated users
CREATE POLICY "Users can create transactions"
ON mpesa_transactions
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE mpesa_transactions IS 'Stores M-Pesa STK Push payment transactions';
COMMENT ON COLUMN mpesa_transactions.checkout_request_id IS 'Unique ID from M-Pesa STK Push request';
COMMENT ON COLUMN mpesa_transactions.merchant_request_id IS 'Merchant request ID from M-Pesa';
COMMENT ON COLUMN mpesa_transactions.status IS 'Transaction status: pending, completed, cancelled, failed';
COMMENT ON COLUMN mpesa_transactions.result_code IS 'M-Pesa result code (0 = success)';
COMMENT ON COLUMN mpesa_transactions.mpesa_receipt_number IS 'M-Pesa receipt number for successful transactions';
COMMENT ON COLUMN mpesa_transactions.transaction_date IS 'Date and time of transaction from M-Pesa';

-- ============================================
-- Grant permissions to authenticated users
-- ============================================
GRANT SELECT ON mpesa_transactions TO authenticated;
GRANT INSERT ON mpesa_transactions TO authenticated;

-- ============================================
-- Create a view for transaction summary
-- ============================================
CREATE OR REPLACE VIEW mpesa_transaction_summary AS
SELECT 
  DATE(created_at) as transaction_date,
  status,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount
FROM mpesa_transactions
GROUP BY DATE(created_at), status
ORDER BY transaction_date DESC;

-- Grant access to summary view
GRANT SELECT ON mpesa_transaction_summary TO authenticated;

-- ============================================
-- Sample data for testing (optional)
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
  result_desc
) VALUES 
(
  'ws_CO_123456789', 
  '12345', 
  '254708374149', 
  100.00, 
  'completed', 
  '0', 
  'The service request is processed successfully.'
),
(
  'ws_CO_987654321', 
  '12346', 
  '254708374150', 
  500.00, 
  'cancelled', 
  '1032', 
  'Request cancelled by user'
);
*/

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'mpesa_transactions'
ORDER BY ordinal_position;
