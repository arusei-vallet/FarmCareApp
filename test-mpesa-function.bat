@echo off
REM ============================================
REM M-Pesa Edge Function Test Script
REM ============================================
REM Tests the deployed mpesa-stk-push function
REM ============================================

echo.
echo ============================================
echo  M-Pesa STK Push - Test
echo ============================================
echo.

REM Configuration
set FUNCTION_URL=https://jluxaezbaiilupmfgmgm.supabase.co/functions/v1/mpesa-stk-push
set ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdXhhZXpiYWlpbHVwbWZnbWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDI2OTAsImV4cCI6MjA4NjM3ODY5MH0.2Psokk5EMrtzrV4sxI-sUczHCchxPrzZCV0W6Q78CEU

REM Test parameters
set PHONE=254703193769
set AMOUNT=1
set REF=TEST-%RANDOM%
set DESC=Test payment

echo Testing STK Push with:
echo   Phone: %PHONE%
echo   Amount: %AMOUNT% KES
echo   Reference: %REF%
echo   Description: %DESC%
echo.
echo Sending request...
echo.

REM Make the request
curl -X POST "%FUNCTION_URL%" ^
  -H "Authorization: Bearer %ANON_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"%PHONE%\", \"amount\": %AMOUNT%, \"accountReference\": \"%REF%\", \"transactionDesc\": \"%DESC%\"}" ^
  -o response.json ^
  2>nul

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Request failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Response:
echo ============================================
type response.json
echo.
echo.

REM Check if successful
findstr /C:""success": true" response.json >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] STK Push initiated successfully!
    echo.
    echo Check your phone (%PHONE%) for the STK push prompt.
    echo Enter PIN: 1234 (sandbox default)
) else (
    echo [ERROR] STK Push failed!
    echo.
    echo Check the response above for details.
)

echo.
echo ============================================
echo.

REM Cleanup
del response.json 2>nul

pause
