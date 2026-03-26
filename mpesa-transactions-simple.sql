-- M-Pesa Transactions Table - Clean Version
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id text NOT NULL UNIQUE,
  merchant_request_id text,
  status text NOT NULL DEFAULT 'pending',
  result_code text,
  result_desc text,
  mpesa_receipt_number text,
  transaction_date timestamptz,
  amount numeric(10, 2),
  phone_number text,
  account_reference text,
  transaction_desc text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout ON mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_order ON mpesa_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_status ON mpesa_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_customer ON mpesa_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_status_created ON mpesa_transactions(status, created_at DESC);

-- Step 3: Enable RLS
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "Users can view own transactions" ON mpesa_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON mpesa_transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON mpesa_transactions;
DROP POLICY IF EXISTS "Service role full access" ON mpesa_transactions;

CREATE POLICY "Users can view own transactions" ON mpesa_transactions FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON mpesa_transactions FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON mpesa_transactions FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = user_id);

CREATE POLICY "Service role full access" ON mpesa_transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Step 5: Create auto-update trigger
DROP TRIGGER IF EXISTS update_mpesa_transactions_updated_at ON mpesa_transactions;
DROP FUNCTION IF EXISTS update_mpesa_transactions_updated_at();

CREATE FUNCTION update_mpesa_transactions_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mpesa_transactions_updated_at
  BEFORE UPDATE ON mpesa_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_mpesa_transactions_updated_at();

-- Verify creation
SELECT '✅ Table created successfully!' as status;
SELECT COUNT(*) as columns FROM information_schema.columns WHERE table_name = 'mpesa_transactions';
