# M-Pesa Payment Implementation Analysis

## Current Issue

```
LOG  Initiating STK Push: {"accountReference": "ORD-d7d8a9ef", "amount": 3, "phoneNumber": "254703193769"}
LOG  STK Push response: {"data": null, "error": [FunctionsHttpError: Edge Function returned a non-2xx status code]}
ERROR  M-Pesa function error: [FunctionsHttpError: Edge Function returned a non-2xx status code]
ERROR  STK Push error: [Error: Edge Function returned a non-2xx status code]
```

## Root Cause

The Edge Function is returning a non-2xx status code, which means it's failing before it can return a proper response. This is likely due to:

### 1. **Missing Environment Variables on Edge Functions** ⚠️ (MOST LIKELY)

The edge functions need M-Pesa credentials configured as **Supabase Secrets**, not just in the local `.env` file.

**Required secrets:**
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL`
- `MPESA_ENVIRONMENT` (optional, defaults to 'sandbox')

### 2. **Missing `.env` File**

There's no `.env` file in the project root - only `.env.example`. The app might not have the required configuration.

### 3. **Callback URL Not Configured Properly**

The callback URL must be:
- Publicly accessible
- Point to your Supabase project's edge function
- Format: `https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback`

## Implementation Flow

```
┌─────────────────┐
│  CheckoutScreen │
│  (Customer)     │
└────────┬────────┘
         │
         │ 1. User selects M-Pesa, enters phone
         │
         ▼
┌─────────────────┐
│  mpesaService.ts│
│  initiateSTKPush│
└────────┬────────┘
         │
         │ 2. Calls Supabase Edge Function
         │    supabase.functions.invoke('mpesa-stk-push')
         │
         ▼
┌─────────────────────────────────────┐
│  Edge Function: mpesa-stk-push      │
│  - Validates phone number           │
│  - Gets access token from Daraja    │
│  - Initiates STK Push               │
│  - Logs transaction to DB           │
└────────┬────────────────────────────┘
         │
         │ 3. Returns CheckoutRequestID
         │
         ▼
┌─────────────────┐
│  CheckoutScreen │
│  Polling loop   │
└────────┬────────┘
         │
         │ 4. Polls database for status
         │
         ▼
┌─────────────────────────────────────┐
│  Edge Function: mpesa-callback      │
│  (Called by M-Pesa when done)       │
│  - Updates transaction status       │
│  - Updates order status             │
└─────────────────────────────────────┘
```

## What's Missing

### 1. Environment Variables Setup

**Create `.env` file in project root:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://jluxaezbaiilupmfgmgm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_actual_key
MPESA_CONSUMER_SECRET=your_actual_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
```

### 2. Supabase Secrets for Edge Functions

Edge functions don't have access to local `.env` files. You need to set secrets:

```bash
# Login to Supabase
npx supabase login

# Set secrets for edge functions
npx supabase secrets set MPESA_CONSUMER_KEY=your_actual_key
npx supabase secrets set MPESA_CONSUMER_SECRET=your_actual_secret
npx supabase secrets set MPESA_SHORTCODE=174379
npx supabase secrets set MPESA_PASSKEY=your_passkey
npx supabase secrets set MPESA_ENVIRONMENT=sandbox
npx supabase secrets set MPESA_CALLBACK_URL=https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
```

### 3. Deploy Edge Functions

```bash
# Deploy all functions
npx supabase functions deploy --project-ref jluxaezbaiilupmfgmgm

# Or deploy individually
npx supabase functions deploy mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm
npx supabase functions deploy mpesa-callback --project-ref jluxaezbaiilupmfgmgm
```

### 4. Database Table Verification

Ensure `mpesa_transactions` table exists with correct schema:

```sql
-- Check if table exists
SELECT * FROM mpesa_transactions LIMIT 1;

-- Required columns:
-- id, checkout_request_id, merchant_request_id, status,
-- result_code, result_desc, mpesa_receipt_number,
-- transaction_date, amount, phone_number, account_reference,
-- transaction_desc, order_id, customer_id, user_id,
-- metadata, created_at, updated_at
```

## Step-by-Step Fix

### Step 1: Get M-Pesa Credentials

1. Go to https://developer.safaricom.co.ke/
2. Login/Create account
3. Create new app
4. Get Consumer Key and Secret
5. For sandbox, use:
   - Shortcode: `174379`
   - Passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

### Step 2: Create `.env` File

Copy `.env.example` to `.env` and fill in actual values.

### Step 3: Set Supabase Secrets

```bash
cd c:\Users\User\farmcare-expo

# Install Supabase CLI if not installed
npm install -g supabase

# Login
npx supabase login

# Set all secrets (replace with actual values)
npx supabase secrets set MPESA_CONSUMER_KEY=YOUR_KEY_HERE
npx supabase secrets set MPESA_CONSUMER_SECRET=YOUR_SECRET_HERE
npx supabase secrets set MPESA_SHORTCODE=174379
npx supabase secrets set MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
npx supabase secrets set MPESA_ENVIRONMENT=sandbox
npx supabase secrets set MPESA_CALLBACK_URL=https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
```

### Step 4: Deploy Functions

```bash
npx supabase functions deploy mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm
npx supabase functions deploy mpesa-callback --project-ref jluxaezbaiilupmfgmgm
```

### Step 5: Test Payment

1. Run the app: `npm start`
2. Add items to cart
3. Go to checkout
4. Select M-Pesa payment
5. Enter phone: `0703193769`
6. Enter amount: `3`
7. Complete checkout

You should receive an STK push on your phone.

## Debugging Tips

### Check Edge Function Logs

```bash
# Watch logs in real-time
npx supabase functions logs mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm

# Or check logs in Supabase Dashboard:
# https://app.supabase.com/project/jluxaezbaiilupmfgmgm/logs
```

### Test Edge Function Directly

```bash
curl -X POST 'https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-stk-push' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "phoneNumber": "254703193769",
    "amount": 1,
    "accountReference": "TEST001",
    "transactionDesc": "Test payment"
  }'
```

### Check Database Transactions

```sql
-- In Supabase SQL Editor
SELECT * FROM mpesa_transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Edge Function returned a non-2xx status code` | Missing secrets or credentials | Set Supabase secrets |
| `Failed to get access token` | Invalid consumer key/secret | Check Daraja credentials |
| `STK Push failed: 400` | Invalid phone format | Ensure format is 2547XXXXXXXX |
| `Callback not received` | Wrong callback URL | Update MPESA_CALLBACK_URL |
| `Duplicate callback` | M-Pesa retry | Already handled in code |
