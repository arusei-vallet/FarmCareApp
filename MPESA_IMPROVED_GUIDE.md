# M-Pesa STK Push - Improved Implementation Guide

## Overview

This guide covers the improved M-Pesa STK Push implementation with enhanced error handling, comprehensive logging, and better transaction tracking.

## What's Improved

### Edge Functions

#### 1. **mpesa-stk-push** (Improved)
- ✅ Enhanced phone number validation with multiple format support
- ✅ Comprehensive logging with request IDs for traceability
- ✅ Detailed error messages for debugging
- ✅ Automatic transaction logging to database
- ✅ Amount validation (min/max limits)
- ✅ Credential validation before API calls
- ✅ Timeout handling for API requests
- ✅ Response validation and error parsing

#### 2. **mpesa-callback** (Improved)
- ✅ Duplicate callback detection
- ✅ Comprehensive M-Pesa result code reference
- ✅ Better metadata extraction and storage
- ✅ Transaction status synchronization with orders
- ✅ Enhanced logging for debugging
- ✅ Graceful error handling
- ✅ Retry attempt tracking

### Database Schema

#### New Features
- ✅ Enhanced `mpesa_transactions` table with additional fields
- ✅ JSONB metadata column for flexible data storage
- ✅ Retry tracking (count and timestamp)
- ✅ Audit fields (IP address, user agent)
- ✅ Improved indexes for performance
- ✅ Analytics views (daily/monthly stats)
- ✅ Helper functions for status updates
- ✅ Auto-updating timestamps

## Deployment Instructions

### Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Supabase project linked**
   ```bash
   npx supabase login
   npx supabase link --project-ref jluxaezbaiilupmfgmgm
   ```

3. **M-Pesa Daraja credentials**
   - Consumer Key
   - Consumer Secret
   - Shortcode (174379 for sandbox)
   - Passkey
   - Callback URL

### Step 1: Set Supabase Secrets

Set the M-Pesa credentials as Supabase secrets (run one at a time):

```bash
npx supabase secrets set MPESA_CONSUMER_KEY="EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D"
```

```bash
npx supabase secrets set MPESA_CONSUMER_SECRET="p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ"
```

```bash
npx supabase secrets set MPESA_SHORTCODE="174379"
```

```bash
npx supabase secrets set MPESA_PASSKEY="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
```

```bash
npx supabase secrets set MPESA_ENVIRONMENT="sandbox"
```

```bash
npx supabase secrets set MPESA_CALLBACK_URL="https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback"
```

### Step 2: Verify Secrets

```bash
npx supabase secrets list
```

You should see all M-Pesa variables listed.

### Step 3: Run Database Migration

1. Go to Supabase SQL Editor: https://app.supabase.com/project/_/sql

2. Copy and paste the contents of `mpesa-transactions-improved.sql`

3. Click "Run" to execute the migration

**⚠️ WARNING:** This will drop the existing `mpesa_transactions` table. If you have existing data, back it up first!

### Step 4: Deploy Edge Functions

Deploy the STK Push function:

```bash
npx supabase functions deploy mpesa-stk-push
```

Deploy the callback function:

```bash
npx supabase functions deploy mpesa-callback
```

### Step 5: Verify Deployment

Check function logs:

```bash
npx supabase functions logs mpesa-stk-push --format json
npx supabase functions logs mpesa-callback --format json
```

## Usage

### From React Native App

```typescript
import { initiateSTKPush, validateMPesaPhone } from './services/mpesaService'

// Validate phone number
const { valid, formatted, error } = validateMPesaPhone('0712345678')
if (!valid) {
  Alert.alert('Invalid Phone', error)
  return
}

// Initiate STK Push
try {
  const result = await initiateSTKPush({
    phoneNumber: formatted, // '254712345678'
    amount: 100,
    accountReference: 'ORDER-12345',
    transactionDesc: 'Payment for Order #12345',
    orderId: 'uuid-of-order',
    userId: 'uuid-of-user',
  })

  console.log('STK Push initiated:', result)
  // CheckoutRequestID: result.CheckoutRequestID

  // Poll for status or wait for callback
} catch (error) {
  console.error('STK Push failed:', error.message)
  Alert.alert('Payment Failed', error.message)
}
```

### Checking Transaction Status

```typescript
import { pollPaymentStatus } from './services/mpesaService'

// Poll database for status updates
const status = await pollPaymentStatus(checkoutRequestId)
console.log('Transaction status:', status)
// { status: 'completed', resultCode: '0', mpesaReceiptNumber: 'QFH4D7V2KL', ... }
```

## Testing

### Sandbox Test Numbers

Use these numbers for testing in sandbox mode:

| Phone Number | Result |
|-------------|--------|
| 254708374149 | Success |
| 254708374150 | Insufficient funds |
| 254708374151 | Bad number (rejected) |

### Test Scenarios

1. **Successful Payment**
   ```
   Phone: 254708374149
   Amount: 100
   Expected: STK push appears → Enter PIN → Success callback
   ```

2. **Insufficient Funds**
   ```
   Phone: 254708374150
   Amount: 10000
   Expected: STK push appears → Enter PIN → Insufficient funds error
   ```

3. **User Cancels**
   ```
   Phone: 254708374149
   Amount: 100
   Expected: STK push appears → Cancel → Cancelled status
   ```

4. **Timeout**
   ```
   Phone: 254708374149
   Amount: 100
   Expected: Don't enter PIN → Timeout after 2 minutes
   ```

## Monitoring and Debugging

### View Function Logs

```bash
# Real-time logs for STK Push
npx supabase functions logs mpesa-stk-push --format json

# Real-time logs for Callback
npx supabase functions logs mpesa-callback --format json

# Last 50 logs
npx supabase functions logs mpesa-stk-push --limit 50
```

### Log Format

Logs are in JSON format with timestamps:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "📱 STK Push request started",
  "requestId": "uuid-here",
  "method": "POST"
}
```

### Common Log Messages

| Emoji | Level | Meaning |
|-------|-------|---------|
| 📱 | INFO | Request started |
| 📥 | INFO | Request/data received |
| ✅ | INFO | Success |
| ❌ | ERROR | Error/failure |
| ⚠️ | WARN | Warning |
| 🔑 | INFO | Token/authentication |
| 🌐 | INFO | External API call |
| 📤 | INFO | Outgoing request |
| 📊 | INFO | Data/response |
| 📝 | INFO | Database operation |
| 🛒 | INFO | Order operation |
| 👤 | INFO | User operation |

### Database Queries

Check recent transactions:

```sql
SELECT
  id,
  checkout_request_id,
  phone_number,
  amount,
  status,
  result_code,
  result_desc,
  mpesa_receipt_number,
  created_at
FROM mpesa_transactions
ORDER BY created_at DESC
LIMIT 20;
```

Check failed transactions:

```sql
SELECT
  checkout_request_id,
  phone_number,
  amount,
  result_code,
  result_desc,
  created_at
FROM mpesa_transactions
WHERE status IN ('failed', 'cancelled')
ORDER BY created_at DESC;
```

Check daily stats:

```sql
SELECT * FROM mpesa_daily_stats
LIMIT 7;
```

## Troubleshooting

### STK Push Not Appearing

1. **Check credentials:**
   ```bash
   npx supabase secrets list
   ```

2. **Check function logs:**
   ```bash
   npx supabase functions logs mpesa-stk-push --format json | grep -i error
   ```

3. **Common issues:**
   - Invalid Consumer Key/Secret
   - Wrong shortcode or passkey
   - Phone number format incorrect
   - Sandbox credentials used in production

### Callback Not Received

1. **Verify callback URL:**
   - Must be: `https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback`
   - Must be publicly accessible

2. **Check callback function logs:**
   ```bash
   npx supabase functions logs mpesa-callback --format json
   ```

3. **Test callback manually:**
   ```bash
   curl -X POST https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback \
     -H "Content-Type: application/json" \
     -d '{
       "Body": {
         "stkCallback": {
           "MerchantRequestID": "test",
           "CheckoutRequestID": "ws_CO_test123",
           "ResultCode": 0,
           "ResultDesc": "Success"
         }
       }
     }'
   ```

### Database Errors

1. **Check table exists:**
   ```sql
   SELECT * FROM mpesa_transactions LIMIT 1;
   ```

2. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'mpesa_transactions';
   ```

3. **Re-run migration if needed**

## M-Pesa Result Codes Reference

| Code | Description |
|------|-------------|
| 0 | Success |
| 1001 | Insufficient Funds |
| 1002 | Less than minimum transaction value |
| 1003 | More than maximum transaction value |
| 1004 | Would exceed daily transfer limit |
| 1006 | Customer has not opted for the service |
| 1007 | Invalid transaction |
| 1008 | Invalid phone number |
| 1010 | Timeout waiting for customer input |
| 1011 | Customer rejected the transaction |
| 1012 | Customer entered wrong PIN |
| 1014 | Request cancelled by user |
| 1016 | System busy |
| 1017 | Duplicate request |

## Security Best Practices

1. **Never expose credentials**
   - Keep M-Pesa credentials in Supabase secrets
   - Never commit `.env` files to Git

2. **Use HTTPS only**
   - All callbacks must use HTTPS
   - Supabase provides HTTPS by default

3. **Validate all inputs**
   - Phone number format
   - Amount limits
   - Account references

4. **Implement rate limiting**
   - Prevent abuse of STK Push endpoint
   - Consider adding retry limits

5. **Monitor transactions**
   - Set up alerts for failed transactions
   - Review logs regularly

## Production Checklist

Before going to production:

- [ ] Change `MPESA_ENVIRONMENT` to `production`
- [ ] Update `MPESA_SHORTCODE` to production paybill
- [ ] Update `MPESA_PASSKEY` to production passkey
- [ ] Update `MPESA_CALLBACK_URL` if needed
- [ ] Test with real phone numbers
- [ ] Set up monitoring and alerts
- [ ] Review and test error handling
- [ ] Document support procedures
- [ ] Test refund process

## Support

For issues:
1. Check function logs first
2. Review M-Pesa result codes
3. Check database for transaction status
4. Contact Safaricom Daraja support for API issues

## Additional Resources

- [M-Pesa Daraja API Docs](https://developer.safaricom.co.ke/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [STK Push Guide](https://developer.safaricom.co.ke/APIs/mpesa-express-api)

---

**Last Updated:** 2026-03-24
**Version:** 2.0 (Improved)
