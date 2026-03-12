# M-Pesa Daraja Integration Setup Guide

This guide will help you connect your FarmCare app with M-Pesa Daraja API for payments.

## Prerequisites

1. **Safaricom Daraja Account**
   - Go to https://developer.safaricom.co.ke/
   - Create an account or login
   - Verify your email and phone number

2. **Supabase Project**
   - You should have a Supabase project set up
   - Edge Functions should be enabled

3. **Supabase CLI** (for deploying functions)
   ```bash
   npm install -g supabase
   ```

## Step 1: Get M-Pesa Credentials

### For Sandbox (Testing)

1. Login to [Daraja Developer Portal](https://developer.safaricom.co.ke/)
2. Go to **Apps** → **Create New App**
3. Fill in the app details:
   - **App Name**: FarmCare Sandbox
   - **App Type**: Select "Sandbox"
4. After creation, you'll get:
   - **Consumer Key** (copy this)
   - **Consumer Secret** (copy this)
5. Under **Credentials**, find:
   - **Shortcode**: `174379` (default test Paybill)
   - **Passkey**: Copy the test passkey
   - **Initiator Name**: `testapi` (for sandbox)

### For Production (Live)

1. Create a **Production App** on Daraja Portal
2. You'll need:
   - Business Paybill Number (e.g., `123456`)
   - Till Number (if using Buy Goods)
   - Initiator Name
   - Security Credentials
3. Contact Safaricom to go live

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the M-Pesa section in `.env`:
   ```env
   # M-Pesa Daraja API Configuration
   MPESA_CONSUMER_KEY=your_actual_consumer_key_here
   MPESA_CONSUMER_SECRET=your_actual_consumer_secret_here
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=your_actual_passkey_here
   MPESA_ENVIRONMENT=sandbox
   MPESA_CALLBACK_URL=https://your-project-ref.supabase.co/functions/v1/mpesa-callback
   ```

   **Important**: Replace:
   - `your_actual_consumer_key_here` with your Consumer Key
   - `your_actual_consumer_secret_here` with your Consumer Secret
   - `your_actual_passkey_here` with your Passkey
   - `your-project-ref` with your Supabase project reference

## Step 3: Set Up Supabase Secrets

The M-Pesa credentials must be stored as Supabase secrets (not in `.env` for production).

### Link to Your Supabase Project

```bash
cd c:\Users\User\farmcare-expo
supabase login
supabase link --project-ref your-project-ref
```

### Set M-Pesa Secrets

```bash
# Set M-Pesa credentials as secrets
supabase secrets set MPESA_CONSUMER_KEY="your_consumer_key"
supabase secrets set MPESA_CONSUMER_SECRET="your_consumer_secret"
supabase secrets set MPESA_SHORTCODE="174379"
supabase secrets set MPESA_PASSKEY="your_passkey"
supabase secrets set MPESA_ENVIRONMENT="sandbox"
supabase secrets set MPESA_CALLBACK_URL="https://your-project-ref.supabase.co/functions/v1/mpesa-callback"

# Also set Supabase credentials (needed for database operations)
supabase secrets set SUPABASE_URL="https://your-project-ref.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

**Note**: Get the `SUPABASE_SERVICE_ROLE_KEY` from:
Supabase Dashboard → Project Settings → API → Service Role Key

## Step 4: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy mpesa-stk-push
supabase functions deploy mpesa-callback

# Or deploy all at once
supabase functions deploy
```

After deployment, your functions will be available at:
- STK Push: `https://your-project-ref.supabase.co/functions/v1/mpesa-stk-push`
- Callback: `https://your-project-ref.supabase.co/functions/v1/mpesa-callback`

## Step 5: Update Database Schema

Make sure the `mpesa_transactions` table exists:

```sql
-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES auth.users(id),
  checkout_request_id TEXT UNIQUE,
  merchant_request_id TEXT,
  phone_number TEXT,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  result_code TEXT,
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  transaction_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout_request 
ON mpesa_transactions(checkout_request_id);

CREATE INDEX IF NOT EXISTS idx_mpesa_order 
ON mpesa_transactions(order_id);

-- Enable Row Level Security
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON mpesa_transactions
FOR SELECT
USING (auth.uid() = customer_id);

-- Policy: Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
ON mpesa_transactions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');
```

## Step 6: Configure M-Pesa Callback URL

1. Login to [Daraja Portal](https://developer.safaricom.co.ke/)
2. Go to your app settings
3. Under **Callback URL**, enter:
   ```
   https://your-project-ref.supabase.co/functions/v1/mpesa-callback
   ```
4. Save changes

**For Sandbox Testing**: The callback URL might not work with localhost. You need to deploy the function first.

## Step 7: Test the Integration

### Test STK Push

1. Start your app:
   ```bash
   npm start
   ```

2. Add items to cart and go to checkout

3. Select **M-Pesa** as payment method

4. Enter phone number in format: `0712 345 678`

5. Click **Place Order**

6. You should receive an STK push on your phone

### Test with Sandbox Credentials

For sandbox testing, use these test phone numbers:
- `254708374149` - Success
- `254708374150` - Insufficient funds
- `254708374151` - Bad number

**Note**: In sandbox, no actual money is transferred. It's a simulation.

## Step 8: Go Live (Production)

When ready for production:

1. **Update Environment Variables**:
   ```bash
   supabase secrets set MPESA_ENVIRONMENT="production"
   supabase secrets set MPESA_SHORTCODE="your_actual_paybill"
   supabase secrets set MPESA_PASSKEY="your_production_passkey"
   supabase secrets set MPESA_CALLBACK_URL="https://your-project-ref.supabase.co/functions/v1/mpesa-callback"
   ```

2. **Update Daraja Portal**:
   - Change callback URL to production URL
   - Ensure you have production credentials

3. **Test with small amounts** before going fully live

## Troubleshooting

### STK Push Not Working

1. **Check logs**:
   ```bash
   supabase functions logs mpesa-stk-push
   ```

2. **Common issues**:
   - Invalid credentials (check Consumer Key/Secret)
   - Wrong phone format (must be `2547XXXXXXXX`)
   - Expired passkey (regenerate in Daraja portal)
   - Callback URL not accessible

### Callback Not Received

1. **Check function logs**:
   ```bash
   supabase functions logs mpesa-callback
   ```

2. **Verify callback URL** is publicly accessible
3. **Check firewall/security** settings in Supabase

### Database Errors

1. **Ensure tables exist** (run SQL from Step 5)
2. **Check RLS policies** allow edge functions to write
3. **Verify service role key** is correct

## Testing Checklist

- [ ] M-Pesa credentials configured in `.env`
- [ ] Supabase secrets set correctly
- [ ] Edge functions deployed
- [ ] Database tables created
- [ ] Callback URL configured in Daraja portal
- [ ] Test STK push received on phone
- [ ] Payment status updates in database
- [ ] Order status updates after payment

## Security Best Practices

1. **Never commit `.env` file** to Git
2. **Use Supabase secrets** for production credentials
3. **Enable RLS** on all tables
4. **Validate all inputs** in edge functions
5. **Use HTTPS** for all callbacks
6. **Monitor transactions** for fraud

## Support

- **Daraja API Docs**: https://developer.safaricom.co.ke/APIs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **M-Pesa Developer Support**: developer@safaricom.co.ke

## Quick Reference

### Phone Number Formats
- Input: `0712 345 678` or `712 345 678`
- Internal: `254712345678`
- Display: `0712 345 678`

### M-Pesa Response Codes
- `0` - Success
- `1032` - Cancelled by user
- `1037` - Timeout
- Others - Various errors

### Test Amounts (Sandbox)
- Any amount works in sandbox
- No actual money is charged
