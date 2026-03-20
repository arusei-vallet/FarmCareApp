# Deploy M-Pesa Edge Functions to Supabase

This guide will help you deploy the M-Pesa STK Push edge functions to your Supabase project.

## Your Configuration

- **Project URL**: `https://jluxaezbaiilupmfgmgm.supabase.co`
- **Project Reference**: `jluxaezbaiilupmfgmgm`

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Run Database Migration

1. Go to: **https://app.supabase.com/project/jluxaezbaiilupmfgmgm/sql**

2. Copy the content from `mpesa-transactions-table.sql` in this project

3. Paste into the SQL Editor and click **"Run"**

4. Verify the table was created by running:
   ```sql
   SELECT * FROM mpesa_transactions LIMIT 1;
   ```

### Step 2: Deploy `mpesa-stk-push` Function

1. Go to: **https://app.supabase.com/project/jluxaezbaiilupmfgmgm/functions**

2. Click **"New Function"**

3. Configure the function:
   - **Function name**: `mpesa-stk-push`
   - **Method**: `POST`
   - **Verify JWT**: `true` (Enabled)
   - **Request size limit**: `1mb`

4. In the **Secrets** section, add these environment variables:
   ```
   MPESA_CONSUMER_KEY=EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D
   MPESA_CONSUMER_SECRET=p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
   MPESA_ENVIRONMENT=sandbox
   MPESA_CALLBACK_URL=https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
   SUPABASE_URL=https://jluxaezbaiilupmfgmgm.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdXhhZXpiYWlpbHVwbWZnbWdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgwMjY5MCwiZXhwIjoyMDg2Mzc4NjkwfQ.O0Nk3yEzWuVNfuc_OQ0bxrurV1a7W7FYQ_SvGW6Tcuo
   ```

5. In the **Code** section, delete the default code and paste the content from:
   `supabase/functions/mpesa-stk-push/index.ts`

6. Click **"Deploy"**

7. After deployment, note the function URL:
   ```
   https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-stk-push
   ```

### Step 3: Deploy `mpesa-callback` Function

1. Go back to: **https://app.supabase.com/project/jluxaezbaiilupmfgmgm/functions**

2. Click **"New Function"**

3. Configure the function:
   - **Function name**: `mpesa-callback`
   - **Method**: `POST`
   - **Verify JWT**: `false` (Disabled - M-Pesa needs to call this without authentication)
   - **Request size limit**: `1mb`

4. In the **Secrets** section, add the SAME environment variables as above:
   ```
   MPESA_CONSUMER_KEY=EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D
   MPESA_CONSUMER_SECRET=p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
   MPESA_ENVIRONMENT=sandbox
   MPESA_CALLBACK_URL=https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
   SUPABASE_URL=https://jluxaezbaiilupmfgmgm.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdXhhZXpiYWlpbHVwbWZnbWdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgwMjY5MCwiZXhwIjoyMDg2Mzc4NjkwfQ.O0Nk3yEzWuVNfuc_OQ0bxrurV1a7W7FYQ_SvGW6Tcuo
   ```

5. In the **Code** section, delete the default code and paste the content from:
   `supabase/functions/mpesa-callback/index.ts`

6. Click **"Deploy"**

7. After deployment, note the function URL:
   ```
   https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
   ```

### Step 4: Configure M-Pesa Daraja Callback URL

1. Go to: **https://developer.safaricom.co.ke/**

2. Login to your Daraja account

3. Go to your app settings

4. Under **Callback URL**, enter:
   ```
   https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
   ```

5. Save changes

### Step 5: Test the Integration

1. **Test STK Push endpoint** (optional - using curl or Postman):
   ```bash
   curl -X POST https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-stk-push \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "phoneNumber": "254708374149",
       "amount": 1,
       "accountReference": "TEST001",
       "transactionDesc": "Test payment"
     }'
   ```

2. **Test from the app**:
   - Start your Expo app: `npm start`
   - Add items to cart
   - Go to checkout
   - Select M-Pesa payment
   - Enter phone number: `0708 374 149` (test number)
   - Place order
   - You should receive an STK push on your phone (sandbox simulation)

## Method 2: Using Supabase CLI (If you can install it)

If you manage to install the Supabase CLI later, you can deploy with:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref jluxaezbaiilupmfgmgm

# Set secrets
supabase secrets set MPESA_CONSUMER_KEY="EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D"
supabase secrets set MPESA_CONSUMER_SECRET="p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ"
supabase secrets set MPESA_SHORTCODE="174379"
supabase secrets set MPESA_PASSKEY="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
supabase secrets set MPESA_ENVIRONMENT="sandbox"
supabase secrets set MPESA_CALLBACK_URL="https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback"
supabase secrets set SUPABASE_URL="https://jluxaezbaiilupmfgmgm.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdXhhZXpiYWlpbHVwbWZnbWdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgwMjY5MCwiZXhwIjoyMDg2Mzc4NjkwfQ.O0Nk3yEzWuVNfuc_OQ0bxrurV1a7W7FYQ_SvGW6Tcuo"

# Deploy functions
supabase functions deploy mpesa-stk-push
supabase functions deploy mpesa-callback
```

## Troubleshooting

### Function Returns 401 Unauthorized
- Make sure you're sending the Authorization header with your anon key
- Check that "Verify JWT" is enabled for `mpesa-stk-push`

### Callback Not Received
- Ensure "Verify JWT" is **disabled** for `mpesa-callback`
- Check that the callback URL in Daraja matches exactly
- Check function logs in Supabase Dashboard

### Database Errors
- Ensure the `mpesa_transactions` table exists
- Check RLS policies allow service role access

### STK Push Fails
- Check M-Pesa credentials are correct
- Ensure phone number format is `2547XXXXXXXX`
- Check function logs in Supabase Dashboard

## Function URLs After Deployment

- **STK Push**: `https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-stk-push`
- **Callback**: `https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback`

## Next Steps

After deployment:
1. Test with sandbox credentials
2. Monitor transactions in Supabase SQL Editor:
   ```sql
   SELECT * FROM mpesa_transactions ORDER BY created_at DESC LIMIT 10;
   ```
3. When ready for production, update the secrets with production credentials
