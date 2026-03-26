-- ============================================
-- M-Pesa Transactions Table
-- ============================================
-- Stores all M-Pesa STK Push transactions
-- Tracks payment status, receipts, and order links
-- ============================================

-- Create the table
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- M-Pesa identifiers
  checkout_request_id text NOT NULL,
  merchant_request_id text,
  
  -- Transaction status
  status text NOT NULL DEFAULT 'pending',
  result_code text,
  result_desc text,
  
  -- Payment details
  mpesa_receipt_number text,
  transaction_date timestamptz,
  amount numeric(10, 2),
  phone_number text,
  
  -- Reference information
  account_reference text,
  transaction_desc text,
  
  -- Links to other tables
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Additional metadata
  metadata jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Fast lookup by CheckoutRequestID (used in callbacks and polling)
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout_request_id 
  ON mpesa_transactions(checkout_request_id);

-- Fast lookup by order ID
CREATE INDEX IF NOT EXISTS idx_mpesa_order_id 
  ON mpesa_transactions(order_id);

-- Fast lookup by status (for monitoring pending/completed transactions)
CREATE INDEX IF NOT EXISTS idx_mpesa_status 
  ON mpesa_transactions(status);

-- Fast lookup by customer ID
CREATE INDEX IF NOT EXISTS idx_mpesa_customer_id 
  ON mpesa_transactions(customer_id);

-- Fast lookup by phone number
CREATE INDEX IF NOT EXISTS idx_mpesa_phone_number 
  ON mpesa_transactions(phone_number);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_mpesa_status_created 
  ON mpesa_transactions(status, created_at DESC);

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE mpesa_transactions IS 
  'Stores M-Pesa STK Push payment transactions and their status';

COMMENT ON COLUMN mpesa_transactions.checkout_request_id IS 
  'Unique ID from M-Pesa for tracking STK push requests';

COMMENT ON COLUMN mpesa_transactions.merchant_request_id IS 
  'Merchant request ID from M-Pesa';

COMMENT ON COLUMN mpesa_transactions.status IS 
  'Transaction status: pending, completed, cancelled, failed';

COMMENT ON COLUMN mpesa_transactions.result_code IS 
  'M-Pesa result code (0 = success, others = various errors)';

COMMENT ON COLUMN mpesa_transactions.mpesa_receipt_number IS 
  'M-Pesa transaction receipt number (e.g., QGH1234567)';

COMMENT ON COLUMN mpesa_transactions.transaction_date IS 
  'Date and time when the transaction was completed';

COMMENT ON COLUMN mpesa_transactions.amount IS 
  'Transaction amount in KES';

COMMENT ON COLUMN mpesa_transactions.phone_number IS 
  'Customer phone number in format 2547XXXXXXXX';

COMMENT ON COLUMN mpesa_transactions.account_reference IS 
  'Account reference (e.g., order number)';

COMMENT ON COLUMN mpesa_transactions.transaction_desc IS 
  'Description of the transaction';

COMMENT ON COLUMN mpesa_transactions.order_id IS 
  'Reference to the associated order';

COMMENT ON COLUMN mpesa_transactions.customer_id IS 
  'Reference to the authenticated user (auth.users)';

COMMENT ON COLUMN mpesa_transactions.user_id IS 
  'Reference to the user profile (users table)';

COMMENT ON COLUMN mpesa_transactions.metadata IS 
  'Additional transaction metadata from M-Pesa';

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON mpesa_transactions
  FOR SELECT
  USING (
    auth.uid() = customer_id 
    OR auth.uid() = user_id
  );

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON mpesa_transactions
  FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id 
    OR auth.uid() = user_id
  );

-- Policy: Users can update their own transactions
CREATE POLICY "Users can update own transactions"
  ON mpesa_transactions
  FOR UPDATE
  USING (
    auth.uid() = customer_id 
    OR auth.uid() = user_id
  );

-- Policy: Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
  ON mpesa_transactions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_mpesa_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mpesa_transactions_updated_at
  BEFORE UPDATE ON mpesa_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_mpesa_transactions_updated_at();

-- ============================================
-- Sample Queries for Testing
-- ============================================

-- View recent transactions
-- SELECT 
--   id,
--   checkout_request_id,
--   status,
--   amount,
--   phone_number,
--   mpesa_receipt_number,
--   created_at
-- FROM mpesa_transactions
-- ORDER BY created_at DESC
-- LIMIT 10;

-- View pending transactions
-- SELECT * FROM mpesa_transactions
-- WHERE status = 'pending'
-- ORDER BY created_at DESC;

-- View successful transactions today
-- SELECT * FROM mpesa_transactions
-- WHERE status = 'completed'
--   AND DATE(created_at) = CURRENT_DATE
-- ORDER BY created_at DESC;

-- View transactions by order
-- SELECT * FROM mpesa_transactions
-- WHERE order_id = 'your-order-id-here';

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ M-Pesa transactions table created successfully!';
  RAISE NOTICE '📊 Table: mpesa_transactions';
  RAISE NOTICE '📝 Columns: 17';
  RAISE NOTICE '🔑 Indexes: 6';
  RAISE NOTICE '🔒 RLS Policies: 4';
  RAISE NOTICE '⚡ Triggers: 1';
END $$;
