-- Orders Table Status Update Migration
-- This adds support for farmer order status management (pending, accepted, rejected)

-- Add new timestamp columns for status tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- Update status check constraint to include new statuses
-- First, drop the existing constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new constraint with all valid statuses
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending', 
  'accepted', 
  'rejected',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
));

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_accepted_at ON orders(accepted_at);
CREATE INDEX IF NOT EXISTS idx_orders_rejected_at ON orders(rejected_at);

-- Comment describing the status workflow
COMMENT ON COLUMN orders.status IS 'Order status: pending (awaiting farmer response), accepted (farmer confirmed), rejected (farmer declined), processing, shipped, delivered, cancelled';
COMMENT ON COLUMN orders.accepted_at IS 'Timestamp when farmer accepted the order';
COMMENT ON COLUMN orders.rejected_at IS 'Timestamp when farmer rejected the order';
