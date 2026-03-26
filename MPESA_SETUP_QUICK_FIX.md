# M-Pesa Setup Guide - Complete Fix

## Problem Summary

Your M-Pesa STK Push is failing with:
```
Edge Function returned a non-2xx status code
```

**Root Cause:** The Edge Functions don't have access to M-Pesa credentials. While you have a `.env` file for the Expo app, the Supabase Edge Functions need their own secrets set directly in Supabase.

## Quick Fix (5 Minutes)

### Step 1: Install Supabase CLI (if not installed)

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
npx supabase login
```

This will open a browser window. Login with your Supabase account.

### Step 3: Set Edge Function Secrets

Run these commands one by one (credentials from your `.env` file):

```bash
# Navigate to project
cd c:\Users\User\farmcare-expo

# Set M-Pesa Consumer Key
npx supabase secrets set MPESA_CONSUMER_KEY=EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D

# Set M-Pesa Consumer Secret
npx supabase secrets set MPESA_CONSUMER_SECRET=p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ

# Set M-Pesa Shortcode
npx supabase secrets set MPESA_SHORTCODE=174379

# Set M-Pesa Passkey
npx supabase secrets set MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

# Set M-Pesa Environment
npx supabase secrets set MPESA_ENVIRONMENT=sandbox

# Set M-Pesa Callback URL
npx supabase secrets set MPESA_CALLBACK_URL=https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
```

### Step 4: Deploy Edge Functions

```bash
# Deploy M-Pesa STK Push function
npx supabase functions deploy mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm

# Deploy M-Pesa Callback function
npx supabase functions deploy mpesa-callback --project-ref jluxaezbaiilupmfgmgm
```

### Step 5: Verify Deployment

```bash
# List all deployed functions
npx supabase functions list --project-ref jluxaezbaiilupmfgmgm
```

You should see:
- `mpesa-stk-push`
- `mpesa-callback`

### Step 6: Test Payment

1. Restart your Expo app: `npm start`
2. Add items to cart
3. Go to checkout
4. Select M-Pesa payment
5. Enter phone: `0703193769`
6. Complete checkout

You should receive an STK push on your phone within seconds!

---

## Alternative: Manual Setup via Supabase Dashboard

If you prefer using the web interface:

### Step 1: Go to Supabase Dashboard

1. Visit: https://app.supabase.com/
2. Select your project: `jluxaezbaiilupmfgmgm`

### Step 2: Navigate to Edge Functions

1. Click **Edge Functions** in the left sidebar
2. Click **Manage Secrets**

### Step 3: Add Secrets

Click **New Secret** and add each one:

| Name | Value |
|------|-------|
| `MPESA_CONSUMER_KEY` | `EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D` |
| `MPESA_CONSUMER_SECRET` | `p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ` |
| `MPESA_SHORTCODE` | `174379` |
| `MPESA_PASSKEY` | `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` |
| `MPESA_ENVIRONMENT` | `sandbox` |
| `MPESA_CALLBACK_URL` | `https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback` |

### Step 4: Redeploy Functions

1. Go to **Edge Functions**
2. Click on `mpesa-stk-push`
3. Click **Deploy** (even without changes, this reloads the secrets)
4. Repeat for `mpesa-callback`

---

## Verification Steps

### 1. Check Database Table

In Supabase SQL Editor:

```sql
-- Check if mpesa_transactions table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mpesa_transactions'
ORDER BY ordinal_position;
```

Required columns:
- `id` (uuid)
- `checkout_request_id` (text)
- `merchant_request_id` (text)
- `status` (text)
- `result_code` (text)
- `result_desc` (text)
- `mpesa_receipt_number` (text)
- `transaction_date` (timestamptz)
- `amount` (numeric)
- `phone_number` (text)
- `account_reference` (text)
- `transaction_desc` (text)
- `order_id` (uuid)
- `customer_id` (uuid)
- `user_id` (uuid)
- `metadata` (jsonb)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. Test Edge Function Directly

```bash
curl -X POST 'https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-stk-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdXhhZXpiYWlpbHVwbWZnbWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDI2OTAsImV4cCI6MjA4NjM3ODY5MH0.2Psokk5EMrtzrV4sxI-sUczHCchxPrzZCV0W6Q78CEU' \
  -H 'Content-Type: application/json' \
  -d '{
    "phoneNumber": "254703193769",
    "amount": 1,
    "accountReference": "TEST001",
    "transactionDesc": "Test payment"
  }'
```

Expected response:
```json
{
  "success": true,
  "CheckoutRequestID": "ws_CO_1234567890abcdef",
  "MerchantRequestID": "12345",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing",
  "CustomerMessage": "Please enter your PIN on your phone"
}
```

### 3. Check Function Logs

```bash
# Watch logs in real-time
npx supabase functions logs mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm

# Or view in dashboard:
# https://app.supabase.com/project/jluxaezbaiilupmfgmgm/logs
```

---

## Troubleshooting

### Error: "Failed to get access token"

**Cause:** Invalid M-Pesa credentials

**Fix:**
1. Verify credentials in Daraja portal: https://developer.safaricom.co.ke/
2. Ensure you're using sandbox credentials for `MPESA_ENVIRONMENT=sandbox`
3. Check that your app is approved on Daraja portal

### Error: "Invalid phone number format"

**Cause:** Phone number not in correct format

**Fix:**
- Use format: `2547XXXXXXXX` (12 digits)
- Valid prefixes: `2547` or `2541`
- Example: `254703193769`

### Error: "Callback URL not reachable"

**Cause:** M-Pesa can't reach your callback endpoint

**Fix:**
1. Verify callback URL is correct: `https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback`
2. Test callback function:
   ```bash
   curl -X POST 'https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback' \
     -H 'Content-Type: application/json' \
     -d '{"test": true}'
   ```
3. Check function is deployed

### STK Push Sent But No Callback Received

**Cause:** M-Pesa sandbox sometimes doesn't send callbacks

**Fix:**
1. Check `mpesa_transactions` table for status updates
2. Use the polling mechanism already implemented in `CheckoutScreen.tsx`
3. Try with small amounts (KES 1-10)

---

## Payment Flow Diagram

```
┌──────────────────┐
│ Customer        │
│ CheckoutScreen  │
└────────┬─────────┘
         │
         │ 1. Enter phone, amount
         │
         ▼
┌──────────────────┐
│ mpesaService.ts  │
│ initiateSTKPush()│
└────────┬─────────┘
         │
         │ 2. Invoke Edge Function
         │    (with auth header)
         │
         ▼
┌──────────────────────────────────┐
│ Edge Function                    │
│ mpesa-stk-push                   │
│                                  │
│ • Validates phone                │
│ • Gets access token from Daraja  │
│ • Initiates STK Push             │
│ • Logs to mpesa_transactions     │
│ • Returns CheckoutRequestID      │
└────────┬─────────────────────────┘
         │
         │ 3. CheckoutRequestID
         │
         ▼
┌──────────────────┐
│ CheckoutScreen   │
│ Start polling    │
│ every 3 seconds  │
└────────┬─────────┘
         │
         │ 4. User enters PIN on phone
         │
         ▼
┌──────────────────┐
│ M-Pesa Daraja    │
│ Processes payment│
└────────┬─────────┘
         │
         │ 5. Callback (async)
         │
         ▼
┌──────────────────────────────────┐
│ Edge Function                    │
│ mpesa-callback                   │
│                                  │
│ • Updates transaction status     │
│ • Updates order status           │
│ • Returns success to M-Pesa      │
└──────────────────────────────────┘
         │
         │ 6. Poll detects completion
         │
         ▼
┌──────────────────┐
│ CheckoutScreen   │
│ Show success     │
│ Clear cart       │
└──────────────────┘
```

---

## Security Notes

✅ **Good practices already implemented:**
- M-Pesa credentials stored in Supabase secrets (not in client code)
- Edge Functions handle all API calls to Daraja
- Phone number validation
- Duplicate callback detection
- Comprehensive logging

⚠️ **Important:**
- Never commit `.env` file to Git (already in `.gitignore` ✓)
- Rotate credentials if ever exposed
- Use sandbox for testing, production credentials for live
- Monitor function logs for suspicious activity

---

## Next Steps After Fix

1. **Test with small amounts** (KES 1-10)
2. **Monitor logs** during first few transactions
3. **Verify database updates** in `mpesa_transactions` table
4. **Test callback** by completing an STK push
5. **Check order status** updates to "paid"

---

## Support Resources

- **Daraja API Docs:** https://developer.safaricom.co.ke/APIs
- **STK Push Guide:** https://developer.safaricom.co.ke/APIs/stkpush
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Project Logs:** https://app.supabase.com/project/jluxaezbaiilupmfgmgm/logs
