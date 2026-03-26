# M-Pesa Edge Functions - Deployment Script
# ============================================
# This script deploys M-Pesa edge functions to Supabase
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " FarmCare M-Pesa Edge Functions Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
try {
    $supabaseVersion = & supabase --version 2>&1
    Write-Host "[OK] Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it first:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Step 1: Login to Supabase" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will open a browser window." -ForegroundColor White
Write-Host "Please login with your Supabase account." -ForegroundColor White
Write-Host ""
pause

try {
    & npx supabase login
    Write-Host ""
    Write-Host "[OK] Login successful!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "[ERROR] Login failed!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Step 2: Setting M-Pesa Secrets" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$secrets = @{
    "MPESA_CONSUMER_KEY" = "EgSzIB6bqtPT8MkrQ7rOGBIHox2RAIq5UFkDv5wS3cy8XH4D"
    "MPESA_CONSUMER_SECRET" = "p2LpmJTtr64vswzgAViSR7N5rXSuo3cMza3dymhwfC4fonFxNw1Azn15WQh5AnsJ"
    "MPESA_SHORTCODE" = "174379"
    "MPESA_PASSKEY" = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
    "MPESA_ENVIRONMENT" = "sandbox"
    "MPESA_CALLBACK_URL" = "https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-callback"
}

foreach ($secret in $secrets.GetEnumerator()) {
    Write-Host "Setting $($secret.Key)..." -ForegroundColor Yellow
    try {
        & npx supabase secrets set "$($secret.Key)=$($secret.Value)"
        Write-Host "[OK] $($secret.Key) set" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Failed to set $($secret.Key)" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "[OK] All secrets configured!" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Step 3: Deploying Edge Functions" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Deploying mpesa-stk-push..." -ForegroundColor Yellow
try {
    & npx supabase functions deploy mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm
    Write-Host "[OK] mpesa-stk-push deployed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to deploy mpesa-stk-push" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Deploying mpesa-callback..." -ForegroundColor Yellow
try {
    & npx supabase functions deploy mpesa-callback --project-ref jluxaezbaiilupmfgmgm
    Write-Host "[OK] mpesa-callback deployed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to deploy mpesa-callback" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "[OK] All functions deployed!" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Step 4: Verification" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fetching deployed functions..." -ForegroundColor Yellow
try {
    & npx supabase functions list --project-ref jluxaezbaiilupmfgmgm
} catch {
    Write-Host "[WARNING] Could not list functions" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host " 1. Restart your Expo app: npm start" -ForegroundColor White
Write-Host " 2. Add items to cart and go to checkout" -ForegroundColor White
Write-Host " 3. Select M-Pesa payment" -ForegroundColor White
Write-Host " 4. Enter phone: 0703193769" -ForegroundColor White
Write-Host " 5. Complete checkout and check your phone for STK push" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor White
Write-Host "  npx supabase functions logs mpesa-stk-push --project-ref jluxaezbaiilupmfgmgm" -ForegroundColor White
Write-Host ""
pause
