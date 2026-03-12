# M-Pesa Daraja Integration - Quick Start

## ✅ What's Been Set Up

### 1. Edge Functions Created
- **mpesa-stk-push**: Initiates STK Push payments
- **mpesa-callback**: Receives payment callbacks from M-Pesa

### 2. Files Created
```
supabase/
├── functions/
│   ├── mpesa-stk-push/
│   │   └── index.ts          # STK Push payment function
│   ├── mpesa-callback/
│   │   └── index.ts          # Payment callback handler
│   └── import_map.json       # Deno imports
```

### 3. Updated Files
- `.env.example` - Updated with M-Pesa configuration
- `tsconfig.json` - Excludes edge functions from TypeScript checking
- `MPESA_SETUP_GUIDE.md` - Complete setup documentation

## 🚀 Quick Setup Steps

### 1. Get M-Pesa Credentials (5 minutes)
1. Go to https://developer.safaricom.co.ke/
2. Create/login to your account
3. Create a new **Sandbox** app
4. Copy:
   - Consumer Key
   - Consumer Secret
   - Shortcode (usually `174379`)
   - Passkey

### 2. Create .env File (1 minute)
```bash
# In project root
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
MPESA_CONSUMER_KEY=your_key_here
MPESA_CONSUMER_SECRET=your_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/mpesa-callback
```

### 3. Deploy to Supabase (5 minutes)
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (replace with your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets (replace with your actual values)
supabase secrets set MPESA_CONSUMER_KEY="your_key"
supabase secrets set MPESA_CONSUMER_SECRET="your_secret"
supabase secrets set MPESA_SHORTCODE="174379"
supabase secrets set MPESA_PASSKEY="your_passkey"
supabase secrets set MPESA_ENVIRONMENT="sandbox"
supabase secrets set MPESA_CALLBACK_URL="https://YOUR_PROJECT_REF.supabase.co/functions/v1/mpesa-callback"
supabase secrets set SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Deploy functions
supabase functions deploy mpesa-stk-push
supabase functions deploy mpesa-callback
```

### 4. Update Database (2 minutes)
Run this SQL in Supabase SQL Editor:

```sql
-- M-Pesa Transactions Table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout_request 
ON mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_order 
ON mpesa_transactions(order_id);

-- RLS
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON mpesa_transactions FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Service role full access"
ON mpesa_transactions FOR ALL
USING (auth.jwt()->>'role' = 'service_role');
```

### 5. Test Payment (2 minutes)
1. Start the app: `npm start`
2. Add items to cart
3. Go to checkout
4. Select **M-Pesa** payment
5. Enter phone: `0712 345 678`
6. Place order
7. Check phone for STK push

## 📱 How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   App UI    │────▶│  Supabase    │────▶│   M-Pesa    │
│ (Checkout)  │     │ Edge Function│     │   Daraja    │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Database   │
                    │ (Transactions│
                    │    Table)    │
                    └──────────────┘
```

1. User enters phone number at checkout
2. App calls `mpesa-stk-push` edge function
3. Edge function calls M-Pesa Daraja API
4. M-Pesa sends STK push to user's phone
5. User enters PIN on phone
6. M-Pesa calls `mpesa-callback` with result
7. Callback updates database
8. App polls database for payment status
9. Order confirmed when payment complete

## 🔧 Configuration

### Phone Number Format
- User enters: `0712 345 678`
- App converts to: `254712345678`
- M-Pesa requirement: `2547XXXXXXXX`

### Test Numbers (Sandbox)
- `254708374149` - Success
- `254708374150` - Insufficient funds
- `254708374151` - Bad number

### Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `MPESA_CONSUMER_KEY` | From Daraja portal | `abc123...` |
| `MPESA_CONSUMER_SECRET` | From Daraja portal | `xyz789...` |
| `MPESA_SHORTCODE` | Paybill number | `174379` |
| `MPESA_PASSKEY` | From Daraja portal | `pass123...` |
| `MPESA_ENVIRONMENT` | `sandbox` or `production` | `sandbox` |
| `MPESA_CALLBACK_URL` | Your callback URL | `https://...` |

## 🐛 Troubleshooting

### STK Push Not Received
1. Check phone format (must be `2547XXXXXXXX`)
2. Verify credentials in Supabase secrets
3. Check function logs: `supabase functions logs mpesa-stk-push`

### Payment Not Updating
1. Check callback logs: `supabase functions logs mpesa-callback`
2. Verify callback URL is correct
3. Check database table exists

### Common Errors
- **Invalid credentials**: Check Consumer Key/Secret
- **Wrong phone format**: Use `2547XXXXXXXX`
- **Callback timeout**: Ensure URL is publicly accessible

## 📚 Documentation

- **Full Setup Guide**: `MPESA_SETUP_GUIDE.md`
- **Daraja API Docs**: https://developer.safaricom.co.ke/APIs
- **Supabase Functions**: https://supabase.com/docs/guides/functions

## 🎯 Next Steps

1. ✅ Test in sandbox mode
2. ✅ Verify payments update order status
3. ✅ Test error scenarios (cancel, timeout)
4. ⏭️ Go live with production credentials

## 💡 Tips

- Keep your `.env` file private (never commit to Git)
- Use sandbox for testing (no real money)
- Monitor transactions in Supabase dashboard
- Set up alerts for failed payments
