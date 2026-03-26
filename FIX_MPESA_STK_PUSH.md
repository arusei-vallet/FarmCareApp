# Fix M-Pesa STK Push Not Working

## Problem
The M-Pesa STK push is not appearing on the user's phone to enter the PIN.

## Root Cause
The M-Pesa credentials in your `.env` file are **not accessible** to the Supabase Edge Function. The Edge Function runs on Supabase's servers, not on your local machine, so it cannot read your local `.env` file.

## Solution: Set Supabase Secrets

You need to set the M-Pesa credentials as **Supabase secrets** so the Edge Function can access them.

### Step 1: Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

Or use npx for one-time use:
```bash
npx supabase
```

### Step 2: Login to Supabase

1. Go to https://app.supabase.com/account/tokens
2. Copy your **access token**
3. Run:
```bash
npx supabase login --token YOUR_ACCESS_TOKEN_HERE
```

Replace `YOUR_ACCESS_TOKEN_HERE` with the actual token from step 2.

### Step 3: Link to Your Supabase Project

Your project URL is: `https://jluxaezbaiilupmfgmgm.supabase.co`
Your project ref is: `jluxaezbaiilupmfgmgm`

Run:
```bash
npx supabase link --project-ref jluxaezbaiilupmfgmgm
```

### Step 4: Set M-Pesa Secrets

Run these commands **one by one**:

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

### Step 5: Verify Secrets

To verify the secrets are set correctly:

```bash
npx supabase secrets list
```

You should see all the M-Pesa variables listed.

### Step 6: Deploy Edge Functions

Deploy the M-Pesa STK Push function:

```bash
npx supabase functions deploy mpesa-stk-push
```

Also deploy the callback function:

```bash
npx supabase functions deploy mpesa-callback
```

### Step 7: Test the STK Push

1. Start your Expo app:
```bash
npm start
```

2. Add items to cart and go to checkout

3. Select **M-Pesa** as payment method

4. Enter phone number: `0712345678` (or any valid Safaricom number)

5. Click **Place Order**

6. **You should now receive an STK push on your phone!**

## Troubleshooting

### Still not receiving STK push?

1. **Check function logs:**
```bash
npx supabase functions logs mpesa-stk-push --format json
```

Look for error messages.

2. **Common issues:**

   - **"Failed to get access token"**: Credentials are wrong. Re-check Consumer Key/Secret from Daraja portal.
   
   - **"Invalid phone number format"**: Phone must be in format `2547XXXXXXXX`. The app should handle this automatically.
   
   - **"STK Push failed: 400"**: Check the error message in logs. Usually invalid credentials or wrong shortcode.
   
   - **No response**: Function might not be deployed. Redeploy with `npx supabase functions deploy mpesa-stk-push`.

3. **Test with sandbox phone numbers:**
   - `254708374149` - Success simulation
   - `254708374150` - Insufficient funds
   - `254708374151` - Bad number

4. **Verify callback URL:**
   The callback URL must be: `https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback`

### Check if secrets are working

Run this to test if the function can access the secrets:

```bash
npx supabase functions logs mpesa-stk-push | grep "M-Pesa"
```

You should see logs like:
```
Using M-Pesa environment: sandbox
Access token obtained successfully
Initiating STK Push for: {...}
STK Push response: {...}
```

## How It Works

1. User enters phone number in app
2. App calls `initiateSTKPush()` in `mpesaService.ts`
3. `mpesaService.ts` calls the Edge Function `mpesa-stk-push`
4. **Edge Function uses secrets** to authenticate with M-Pesa Daraja API
5. M-Pesa sends STK push to user's phone
6. User enters PIN on phone
7. M-Pesa calls callback URL with payment result
8. Database is updated with payment status
9. App polls database and shows success/failure

## Important Notes

- **Sandbox mode**: No real money is charged. It's a simulation.
- **Production mode**: When ready to go live, change `MPESA_ENVIRONMENT` to `production` and use real Paybill credentials.
- **Security**: Never commit `.env` with real credentials to Git. Always use Supabase secrets for production.

## Quick Command Reference

```bash
# Login
npx supabase login --token YOUR_TOKEN

# Link project
npx supabase link --project-ref jluxaezbaiilupmfgmgm

# Set all secrets (run one at a time)
npx supabase secrets set MPESA_CONSUMER_KEY="EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D"
npx supabase secrets set MPESA_CONSUMER_SECRET="p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ"
npx supabase secrets set MPESA_SHORTCODE="174379"
npx supabase secrets set MPESA_PASSKEY="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
npx supabase secrets set MPESA_ENVIRONMENT="sandbox"
npx supabase secrets set MPESA_CALLBACK_URL="https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback"

# Deploy functions
npx supabase functions deploy mpesa-stk-push
npx supabase functions deploy mpesa-callback

# View logs
npx supabase functions logs mpesa-stk-push --format json
```

## Next Steps After Fix

1. ✅ Test with small amount (e.g., KES 10)
2. ✅ Verify payment status updates in database
3. ✅ Check that order status changes to "paid"
4. ✅ Test cancellation flow (cancel STK push on phone)
5. ✅ Test timeout scenario

---

**Need help?** Run the commands above and check the logs for specific error messages.
