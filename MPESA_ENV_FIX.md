# Fix M-Pesa STK Push Error

## Problem
```
ERROR STK Push error: [FunctionsHttpError: Edge Function returned a non-2xx status code]
```

This error occurs because the M-Pesa credentials are not configured in your Supabase Edge Function.

## Solution

### Step 1: Get M-Pesa Credentials

1. Go to [Safaricom Daraja Developer Portal](https://developer.safaricom.co.ke/)
2. Log in or create an account
3. Go to **Apps** → **Create New App** (or select existing app)
4. Copy the following credentials:
   - **Consumer Key**
   - **Consumer Secret**
   - **Passkey** (found under Credentials tab)

### Step 2: Set Edge Function Secrets

Run these commands in your terminal, replacing the values with your actual credentials:

```bash
# Navigate to your project
cd c:\Users\User\farmcare-expo

# Login to Supabase CLI (if not already logged in)
npx supabase login

# Link to your Supabase project (if not already linked)
npx supabase link --project-ref your-project-ref

# Set M-Pesa secrets for Edge Functions
npx supabase secrets set MPESA_CONSUMER_KEY="your_consumer_key_here"
npx supabase secrets set MPESA_CONSUMER_SECRET="your_consumer_secret_here"
npx supabase secrets set MPESA_SHORTCODE="174379"
npx supabase secrets set MPESA_PASSKEY="your_passkey_here"
npx supabase secrets set MPESA_ENVIRONMENT="sandbox"
npx supabase secrets set MPESA_CALLBACK_URL="https://your-project-ref.supabase.co/functions/v1/mpesa-callback"
```

### Step 3: Deploy Edge Functions

```bash
# Deploy the M-Pesa functions
npx supabase functions deploy mpesa-stk-push
npx supabase functions deploy mpesa-callback
```

### Step 4: Verify Deployment

```bash
# Check function logs
npx supabase functions logs mpesa-stk-push
```

### Step 5: Test Payment

1. Open your app
2. Add items to cart
3. Go to checkout
4. Select M-Pesa payment
5. Enter phone number (e.g., `0712345678`)
6. Click "Place Order"
7. You should receive an STK Push on your phone

## Troubleshooting

### Still getting errors?

1. **Check function logs:**
   ```bash
   npx supabase functions logs mpesa-stk-push --format json
   ```

2. **Verify secrets are set:**
   ```bash
   npx supabase secrets list
   ```

3. **Common issues:**
   - **Invalid credentials**: Double-check Consumer Key/Secret from Daraja portal
   - **Wrong shortcode**: For sandbox, use `174379`
   - **Callback URL not reachable**: Make sure it's `https://your-project-ref.supabase.co/functions/v1/mpesa-callback`
   - **Phone format**: Must be `2547XXXXXXXX` (the app handles this automatically)

### Test with Daraja Directly

To verify your credentials work, test directly on Daraja:

```bash
curl -X POST "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "BusinessShortCode": "174379",
    "Password": "BASE64_ENCODED_PASSWORD",
    "Timestamp": "TIMESTAMP",
    "TransactionType": "CustomerPayBillOnline",
    "Amount": 1,
    "PartyA": "254708374149",
    "PartyB": "174379",
    "PhoneNumber": "254708374149",
    "CallBackURL": "https://your-project-ref.supabase.co/functions/v1/mpesa-callback",
    "AccountReference": "Test",
    "TransactionDesc": "Test Payment"
  }'
```

## Notes

- **Sandbox vs Production**: Start with `sandbox` environment. Switch to `production` only when ready to go live.
- **Security**: Never commit `.env` files with real credentials to Git.
- **Callback**: The callback URL must be publicly accessible (Supabase Edge Functions URL works).
