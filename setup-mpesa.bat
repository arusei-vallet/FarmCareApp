@echo off
echo ===========================================
echo FarmCare - M-Pesa STK Push Setup
echo ===========================================
echo.
echo This script will set up M-Pesa credentials for your Supabase Edge Functions
echo.
echo BEFORE RUNNING:
echo 1. Get your Supabase access token from: https://app.supabase.com/account/tokens
echo 2. Replace YOUR_ACCESS_TOKEN_HERE with your actual token in this script
echo.
pause

REM Set your Supabase access token here
set SUPABASE_TOKEN=YOUR_ACCESS_TOKEN_HERE

REM Project reference
set PROJECT_REF=jluxaezbaiilupmfgmgm

echo.
echo Step 1: Logging in to Supabase...
npx supabase login --token %SUPABASE_TOKEN%
if errorlevel 1 (
    echo ERROR: Login failed. Please check your access token.
    pause
    exit /b 1
)

echo.
echo Step 2: Linking to Supabase project...
npx supabase link --project-ref %PROJECT_REF%
if errorlevel 1 (
    echo ERROR: Failed to link project.
    pause
    exit /b 1
)

echo.
echo Step 3: Setting M-Pesa secrets...
echo.

echo Setting MPESA_CONSUMER_KEY...
npx supabase secrets set MPESA_CONSUMER_KEY="EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D"
if errorlevel 1 (
    echo ERROR: Failed to set MPESA_CONSUMER_KEY
    pause
    exit /b 1
)

echo Setting MPESA_CONSUMER_SECRET...
npx supabase secrets set MPESA_CONSUMER_SECRET="p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ"
if errorlevel 1 (
    echo ERROR: Failed to set MPESA_CONSUMER_SECRET
    pause
    exit /b 1
)

echo Setting MPESA_SHORTCODE...
npx supabase secrets set MPESA_SHORTCODE="174379"
if errorlevel 1 (
    echo ERROR: Failed to set MPESA_SHORTCODE
    pause
    exit /b 1
)

echo Setting MPESA_PASSKEY...
npx supabase secrets set MPESA_PASSKEY="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
if errorlevel 1 (
    echo ERROR: Failed to set MPESA_PASSKEY
    pause
    exit /b 1
)

echo Setting MPESA_ENVIRONMENT...
npx supabase secrets set MPESA_ENVIRONMENT="sandbox"
if errorlevel 1 (
    echo ERROR: Failed to set MPESA_ENVIRONMENT
    pause
    exit /b 1
)

echo Setting MPESA_CALLBACK_URL...
npx supabase secrets set MPESA_CALLBACK_URL="https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback"
if errorlevel 1 (
    echo ERROR: Failed to set MPESA_CALLBACK_URL
    pause
    exit /b 1
)

echo.
echo Step 4: Deploying Edge Functions...
echo.

echo Deploying mpesa-stk-push function...
npx supabase functions deploy mpesa-stk-push
if errorlevel 1 (
    echo ERROR: Failed to deploy mpesa-stk-push
    pause
    exit /b 1
)

echo Deploying mpesa-callback function...
npx supabase functions deploy mpesa-callback
if errorlevel 1 (
    echo ERROR: Failed to deploy mpesa-callback
    pause
    exit /b 1
)

echo.
echo ===========================================
echo SUCCESS! M-Pesa STK Push is now configured
echo ===========================================
echo.
echo Next steps:
echo 1. Start your app: npm start
echo 2. Add items to cart and checkout
echo 3. Select M-Pesa and enter phone number
echo 4. You should receive STK push on your phone!
echo.
echo To view logs: npx supabase functions logs mpesa-stk-push --format json
echo.
pause
