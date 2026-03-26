@echo off
REM ============================================
REM M-Pesa Edge Functions Setup Script
REM ============================================
REM This script sets up M-Pesa credentials as Supabase secrets
REM and deploys the edge functions
REM ============================================

echo.
echo ============================================
echo  FarmCare M-Pesa Setup
echo ============================================
echo.
echo This script will:
echo  1. Login to Supabase
echo  2. Set M-Pesa credentials as secrets
echo  3. Deploy edge functions
echo  4. Verify deployment
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Supabase CLI not found!
    echo.
    echo Please install it first:
    echo   npm install -g supabase
    echo.
    pause
    exit /b 1
)

echo [OK] Supabase CLI found
echo.

REM Step 1: Login
echo ============================================
echo  Step 1: Login to Supabase
echo ============================================
echo.
echo This will open a browser window.
echo Please login with your Supabase account.
echo.
pause

npx supabase login
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Login failed!
    pause
    exit /b 1
)

echo.
echo [OK] Login successful!
echo.

REM Step 2: Set Secrets
echo ============================================
echo  Step 2: Setting M-Pesa Secrets
echo ============================================
echo.

echo Setting MPESA_CONSUMER_KEY...
npx supabase secrets set MPESA_CONSUMER_KEY=EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Failed to set MPESA_CONSUMER_KEY
) else (
    echo [OK] MPESA_CONSUMER_KEY set
)

echo.
echo Setting MPESA_CONSUMER_SECRET...
npx supabase secrets set MPESA_CONSUMER_SECRET=p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Failed to set MPESA_CONSUMER_SECRET
) else (
    echo [OK] MPESA_CONSUMER_SECRET set
)

echo.
echo Setting MPESA_SHORTCODE...
npx supabase secrets set MPESA_SHORTCODE=174379
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Failed to set MPESA_SHORTCODE
) else (
    echo [OK] MPESA_SHORTCODE set
)

echo.
echo Setting MPESA_PASSKEY...
npx supabase secrets set MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Failed to set MPESA_PASSKEY
) else (
    echo [OK] MPESA_PASSKEY set
)

echo.
echo Setting MPESA_ENVIRONMENT...
npx supabase secrets set MPESA_ENVIRONMENT=sandbox
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Failed to set MPESA_ENVIRONMENT
) else (
    echo [OK] MPESA_ENVIRONMENT set
)

echo.
echo Setting MPESA_CALLBACK_URL...
npx supabase secrets set MPESA_CALLBACK_URL=https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Failed to set MPESA_CALLBACK_URL
) else (
    echo [OK] MPESA_CALLBACK_URL set
)

echo.
echo [OK] All secrets configured!
echo.

REM Step 3: Deploy Functions
echo ============================================
echo  Step 3: Deploying Edge Functions
echo ============================================
echo.

echo Deploying mpesa-stk-push...
npx supabase functions deploy mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to deploy mpesa-stk-push
    pause
    exit /b 1
) else (
    echo [OK] mpesa-stk-push deployed
)

echo.
echo Deploying mpesa-callback...
npx supabase functions deploy mpesa-callback --project-ref jluxaezbaiilupmfgmgm
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to deploy mpesa-callback
    pause
    exit /b 1
) else (
    echo [OK] mpesa-callback deployed
)

echo.
echo [OK] All functions deployed!
echo.

REM Step 4: Verify
echo ============================================
echo  Step 4: Verification
echo ============================================
echo.
echo Fetching deployed functions...
npx supabase functions list --project-ref jluxaezbaiilupmfgmgm

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Restart your Expo app: npm start
echo 2. Add items to cart and go to checkout
echo 3. Select M-Pesa payment
echo 4. Enter phone: 0703193769
echo 5. Complete checkout and check your phone for STK push
echo.
echo To view logs:
echo   npx supabase functions logs mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm
echo.
pause
