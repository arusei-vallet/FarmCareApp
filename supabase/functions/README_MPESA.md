# M-Pesa Edge Functions

Secure serverless functions for processing M-Pesa STK Push payments via Safaricom's Daraja API.

## 📁 Functions Overview

### 1. `mpesa-stk-push` - Initiate Payment

Initiates an STK Push payment request to M-Pesa Daraja API.

**Features:**
- ✅ Phone number validation (Kenyan formats)
- ✅ Amount validation (KES 1-150,000)
- ✅ Secure credential handling via Supabase Secrets
- ✅ Comprehensive logging for debugging
- ✅ Transaction logging to database
- ✅ Real-time error reporting

**Request:**
```json
POST https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-stk-push
Authorization: Bearer <anon-key>

{
  "phoneNumber": "254703193769",
  "amount": 100,
  "accountReference": "ORD-12345",
  "transactionDesc": "FarmCare Order Payment",
  "orderId": "uuid-here",
  "userId": "uuid-here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "CheckoutRequestID": "ws_CO_1234567890abcdef",
  "MerchantRequestID": "12345",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing",
  "CustomerMessage": "Please enter your PIN on your phone",
  "transactionId": "uuid-here",
  "requestId": "uuid-here"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid phone number format. Use 07XXXXXXXX, 7XXXXXXXX, or 2547XXXXXXXX",
  "requestId": "uuid-here"
}
```

---

### 2. `mpesa-callback` - Payment Result Handler

Receives callbacks from M-Pesa Daraja API when payment is completed.

**Features:**
- ✅ Duplicate callback detection
- ✅ Transaction status updates
- ✅ Order status synchronization
- ✅ Comprehensive result code handling
- ✅ Idempotent processing

**Callback Flow:**
1. M-Pesa processes payment
2. M-Pesa POSTs result to callback URL
3. Function updates `mpesa_transactions` table
4. Function updates `orders` table (if linked)
5. Returns success to M-Pesa

---

## 🔐 Required Secrets

These must be set in Supabase before deployment:

| Secret | Description | Example |
|--------|-------------|---------|
| `MPESA_CONSUMER_KEY` | Daraja API Consumer Key | `EgSzIB6bqtPT...` |
| `MPESA_CONSUMER_SECRET` | Daraja API Consumer Secret | `p2LpmJTtr64v...` |
| `MPESA_SHORTCODE` | Paybill/Till Number | `174379` |
| `MPESA_PASSKEY` | Daraja Passkey | `bfb279f9aa9b...` |
| `MPESA_ENVIRONMENT` | `sandbox` or `production` | `sandbox` |
| `MPESA_CALLBACK_URL` | Public callback URL | `https://.../mpesa-callback` |

### Set Secrets (CLI)

```bash
npx supabase secrets set MPESA_CONSUMER_KEY=your_key
npx supabase secrets set MPESA_CONSUMER_SECRET=your_secret
npx supabase secrets set MPESA_SHORTCODE=174379
npx supabase secrets set MPESA_PASSKEY=your_passkey
npx supabase secrets set MPESA_ENVIRONMENT=sandbox
npx supabase secrets set MPESA_CALLBACK_URL=https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
```

---

## 🚀 Deployment

### Quick Deploy (PowerShell)

```powershell
.\deploy-mpesa-functions.ps1
```

### Manual Deploy

```bash
# Login
npx supabase login

# Deploy functions
npx supabase functions deploy mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm
npx supabase functions deploy mpesa-callback --project-ref jluxaezbaiilupmfgmgm

# Verify
npx supabase functions list --project-ref jluxaezbaiilupmfgmgm
```

---

## 🧪 Testing

### Test STK Push (cURL)

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

### Test via Expo App

1. Start Expo: `npm start`
2. Add items to cart
3. Go to checkout
4. Select M-Pesa payment
5. Phone: `0703193769`, Amount: `1`
6. Complete checkout
7. Check phone for STK push

---

## 📊 Database Schema

### `mpesa_transactions` Table

```sql
CREATE TABLE mpesa_transactions (
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

CREATE INDEX idx_mpesa_checkout ON mpesa_transactions(checkout_request_id);
CREATE INDEX idx_mpesa_order ON mpesa_transactions(order_id);
CREATE INDEX idx_mpesa_status ON mpesa_transactions(status);
```

---

## 🔍 Monitoring & Debugging

### View Logs (Real-time)

```bash
npx supabase functions logs mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm
npx supabase functions logs mpesa-callback --project-ref jluxaezbaiilupmfgmgm
```

### View Logs (Dashboard)

Visit: https://app.supabase.com/project/jluxaezbaiilupmfgmgm/logs

### Check Transactions (SQL)

```sql
-- Recent transactions
SELECT 
  id,
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

-- Transaction by order
SELECT * FROM mpesa_transactions
WHERE order_id = 'your-order-id';
```

---

## 📱 Phone Number Formats

The functions accept and validate these formats:

| Input Format | Formatted Output | Valid |
|-------------|------------------|-------|
| `0712345678` | `254712345678` | ✅ |
| `712345678` | `254712345678` | ✅ |
| `112345678` | `254112345678` | ✅ |
| `254712345678` | `254712345678` | ✅ |
| `+254712345678` | `254712345678` | ✅ |
| `0112345678` | `254112345678` | ✅ |

Invalid formats are rejected with clear error messages.

---

## ⚠️ Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Edge Function returned a non-2xx status code` | Missing secrets | Set Supabase secrets |
| `Failed to get access token` | Invalid credentials | Check Daraja portal |
| `Invalid phone number format` | Wrong format | Use 2547XXXXXXXX |
| `STK Push failed: 400` | M-Pesa rejected | Check phone/PIN |
| `Callback not received` | Wrong URL | Update MPESA_CALLBACK_URL |
| `Duplicate callback` | M-Pesa retry | Already handled |

---

## 🔒 Security Best Practices

✅ **Implemented:**
- Credentials stored in Supabase Secrets (not in code)
- All Daraja API calls server-side
- Phone number validation
- Amount validation (1-150,000 KES)
- Duplicate callback detection
- Comprehensive audit logging
- CORS headers configured

⚠️ **Important:**
- Never commit `.env` files
- Rotate credentials if exposed
- Monitor logs for suspicious activity
- Use sandbox for testing
- Rate limit production endpoints

---

## 📚 References

- **Daraja API Docs:** https://developer.safaricom.co.ke/APIs
- **STK Push Guide:** https://developer.safaricom.co.ke/APIs/stkpush
- **Supabase Functions:** https://supabase.com/docs/guides/functions
- **M-Pesa Result Codes:** See function source code

---

## 🆘 Support

For issues:
1. Check function logs first
2. Verify secrets are set correctly
3. Test with small amounts (KES 1-10)
4. Review Daraja portal for API status
5. Check database for transaction records

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-26  
**Project:** FarmCare Expo
