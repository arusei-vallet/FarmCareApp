# M-Pesa Edge Functions - Complete Setup Guide

## 🎯 Overview

This guide walks you through setting up M-Pesa STK Push payments for FarmCare Expo using Supabase Edge Functions.

---

## 📋 What You Have Now

### Edge Functions Created ✅

1. **`mpesa-stk-push`** - Initiates STK Push payments
   - Location: `supabase/functions/mpesa-stk-push/index.ts`
   - Features: Phone validation, amount validation, transaction logging, comprehensive error handling

2. **`mpesa-callback`** - Handles M-Pesa callbacks
   - Location: `supabase/functions/mpesa-callback/index.ts`
   - Features: Duplicate detection, order updates, result code handling

### Configuration Files Created ✅

- `supabase/functions/mpesa-stk-push/deno.json` - Function config
- `supabase/functions/mpesa-callback/deno.json` - Function config
- `supabase/functions/README_MPESA.md` - Complete documentation

### Deployment Scripts Created ✅

- **Windows Batch:** `setup-mpesa-secrets.bat` - Full setup (login + secrets + deploy)
- **PowerShell:** `deploy-mpesa-functions.ps1` - Full setup with colors
- **Test Script:** `test-mpesa-function.bat` - Test the deployed function

### Documentation Created ✅

- `MPESA_SETUP_QUICK_FIX.md` - Quick fix guide
- `MPESA_ISSUES_ANALYSIS.md` - Technical analysis
- `MPESA_SETUP_COMPLETE_GUIDE.md` - This file

---

## 🚀 Quick Start (3 Steps)

### Option 1: Automated Setup (Recommended)

Run one of these scripts:

**Windows (Batch):**
```bash
c:\Users\User\farmcare-expo> setup-mpesa-secrets.bat
```

**Windows (PowerShell):**
```powershell
c:\Users\User\farmcare-expo> .\deploy-mpesa-functions.ps1
```

The script will:
1. ✅ Login to Supabase
2. ✅ Set all 6 M-Pesa secrets
3. ✅ Deploy both edge functions
4. ✅ Verify deployment

### Option 2: Manual Setup

If you prefer manual control:

#### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

#### Step 2: Login

```bash
npx supabase login
```

This opens a browser. Login with your Supabase account.

#### Step 3: Set Secrets

```bash
cd c:\Users\User\farmcare-expo

# M-Pesa Consumer Key
npx supabase secrets set MPESA_CONSUMER_KEY=EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D

# M-Pesa Consumer Secret
npx supabase secrets set MPESA_CONSUMER_SECRET=p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ

# M-Pesa Shortcode (Sandbox)
npx supabase secrets set MPESA_SHORTCODE=174379

# M-Pesa Passkey (Sandbox)
npx supabase secrets set MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

# Environment
npx supabase secrets set MPESA_ENVIRONMENT=sandbox

# Callback URL
npx supabase secrets set MPESA_CALLBACK_URL=https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
```

#### Step 4: Deploy Functions

```bash
# Deploy STK Push function
npx supabase functions deploy mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm

# Deploy Callback function
npx supabase functions deploy mpesa-callback --project-ref jluxaezbaiilupmfgmgm
```

#### Step 5: Verify

```bash
npx supabase functions list --project-ref jluxaezbaiilupmfgmgm
```

You should see:
```
┌─────────────────────┬──────────────────────┬─────────────┐
│ NAME                │ VERSION              │ STATUS      │
├─────────────────────┼──────────────────────┼─────────────┤
│ mpesa-stk-push      │ 1                    │ ACTIVE      │
│ mpesa-callback      │ 1                    │ ACTIVE      │
└─────────────────────┴──────────────────────┴─────────────┘
```

---

## 🧪 Testing

### Test 1: Via Script

```bash
c:\Users\User\farmcare-expo> test-mpesa-function.bat
```

This sends a test STK push to `254703193769` for KES 1.

### Test 2: Via cURL

```bash
curl -X POST 'https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-stk-push' ^
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdXhhZXpiYWlpbHVwbWZnbWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDI2OTAsImV4cCI6MjA4NjM3ODY5MH0.2Psokk5EMrtzrV4sxI-sUczHCchxPrzZCV0W6Q78CEU' ^
  -H 'Content-Type: application/json' ^
  -d "{\"phoneNumber\": \"254703193769\", \"amount\": 1, \"accountReference\": \"TEST001\", \"transactionDesc\": \"Test payment\"}"
```

Expected response:
```json
{
  "success": true,
  "CheckoutRequestID": "ws_CO_...",
  "CustomerMessage": "Please enter your PIN on your phone"
}
```

### Test 3: Via Expo App

1. **Start Expo:**
   ```bash
   npm start
   ```

2. **Add items to cart**

3. **Go to checkout**

4. **Select M-Pesa payment**

5. **Enter details:**
   - Phone: `0703193769`
   - Amount: `1`

6. **Complete checkout**

7. **Check your phone** - You should receive an STK push prompt

8. **Enter PIN:** `1234` (sandbox default)

---

## 🔍 Monitoring

### View Logs (Real-time)

```bash
# Watch STK push logs
npx supabase functions logs mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm

# Watch callback logs
npx supabase functions logs mpesa-callback --project-ref jluxaezbaiilupmfgmgm
```

### View Dashboard

Visit: https://app.supabase.com/project/jluxaezbaiilupmfgmgm/logs

### Check Database

In Supabase SQL Editor:

```sql
-- Recent transactions
SELECT 
  checkout_request_id,
  status,
  amount,
  phone_number,
  mpesa_receipt_number,
  created_at
FROM mpesa_transactions
ORDER BY created_at DESC
LIMIT 10;

-- Failed transactions
SELECT * FROM mpesa_transactions
WHERE status != 'completed'
ORDER BY created_at DESC;
```

---

## 📱 Payment Flow

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
         │
         ▼
┌──────────────────────────────────┐
│ Edge Function                    │
│ mpesa-stk-push                   │
│                                  │
│ • Validates phone                │
│ • Gets access token              │
│ • Initiates STK Push             │
│ • Logs to database               │
│ • Returns CheckoutRequestID      │
└────────┬─────────────────────────┘
         │
         │ 3. CheckoutRequestID
         │
         ▼
┌──────────────────┐
│ CheckoutScreen   │
│ Start polling    │
│ (every 3s)       │
└────────┬─────────┘
         │
         │ 4. User enters PIN
         │
         ▼
┌──────────────────┐
│ M-Pesa Daraja    │
│ Processes        │
└────────┬─────────┘
         │
         │ 5. Callback (async)
         │
         ▼
┌──────────────────────────────────┐
│ Edge Function                    │
│ mpesa-callback                   │
│                                  │
│ • Updates transaction            │
│ • Updates order                  │
│ • Returns success                │
└──────────────────────────────────┘
         │
         │ 6. Poll detects success
         │
         ▼
┌──────────────────┐
│ CheckoutScreen   │
│ Show success ✅  │
│ Clear cart       │
└──────────────────┘
```

---

## ⚠️ Troubleshooting

### Error: "Edge Function returned a non-2xx status code"

**Cause:** Missing Supabase secrets

**Fix:**
```bash
npx supabase secrets set MPESA_CONSUMER_KEY=...
npx supabase secrets set MPESA_CONSUMER_SECRET=...
# ... set all secrets, then redeploy
npx supabase functions deploy mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm
```

### Error: "Failed to get access token"

**Cause:** Invalid M-Pesa credentials

**Fix:**
1. Visit https://developer.safaricom.co.ke/
2. Verify your Consumer Key and Secret
3. Update secrets if needed

### Error: "Invalid phone number format"

**Cause:** Phone not in correct format

**Fix:**
- Use: `2547XXXXXXXX` (12 digits)
- Valid prefixes: `2547` or `2541`
- Example: `254703193769`

### No STK Push Received

**Possible causes:**
1. Wrong phone number format
2. M-Pesa sandbox issues
3. Network timeout

**Fix:**
- Check logs: `npx supabase functions logs mpesa-stk-push`
- Try different phone: `254712345678`
- Use small amount: KES 1

### Callback Not Received

**Cause:** M-Pesa sandbox sometimes doesn't send callbacks

**Fix:**
- Check `mpesa_transactions` table for status
- The app already polls the database every 3 seconds
- This is normal in sandbox mode

---

## 🔐 Security Checklist

✅ **Done:**
- [x] Credentials in Supabase Secrets (not in code)
- [x] Server-side API calls (not client)
- [x] Phone number validation
- [x] Amount validation (1-150,000 KES)
- [x] Duplicate callback detection
- [x] Comprehensive logging
- [x] CORS headers configured
- [x] Error handling

⚠️ **Remember:**
- Never commit `.env` files
- Rotate credentials if exposed
- Monitor logs regularly
- Use sandbox for testing
- Rate limit in production

---

## 📊 Database Schema

Ensure you have the `mpesa_transactions` table:

```sql
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id text UNIQUE NOT NULL,
  merchant_request_id text,
  status text NOT NULL DEFAULT 'pending',
  result_code text,
  result_desc text,
  mpesa_receipt_number text,
  transaction_date timestamptz,
  amount numeric,
  phone_number text,
  account_reference text,
  transaction_desc text,
  order_id uuid REFERENCES orders(id),
  customer_id uuid REFERENCES auth.users(id),
  user_id uuid REFERENCES users(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mpesa_checkout ON mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_order ON mpesa_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_status ON mpesa_transactions(status);
```

---

## 📚 Resources

- **Daraja API:** https://developer.safaricom.co.ke/APIs
- **STK Push:** https://developer.safaricom.co.ke/APIs/stkpush
- **Supabase Functions:** https://supabase.com/docs/guides/functions
- **Project Logs:** https://app.supabase.com/project/jluxaezbaiilupmfgmgm/logs

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase
- [ ] All 6 secrets set
- [ ] Both functions deployed
- [ ] Functions show "ACTIVE" status
- [ ] Test STK push successful
- [ ] Received STK push on phone
- [ ] Database record created
- [ ] Logs visible in dashboard

---

## 🎉 Success!

If everything works:

1. ✅ You can initiate STK pushes
2. ✅ Payments are logged to database
3. ✅ Callbacks are processed
4. ✅ Order statuses update automatically

**You're ready to accept M-Pesa payments!** 🚀

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-26  
**Project:** FarmCare Expo  
**Project Ref:** jluxaezbaiilupmfgmgm
