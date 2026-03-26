@echo off
REM ============================================
REM FarmCare Logo Setup Script
REM ============================================

echo.
echo ============================================
echo  FarmCare Logo Setup
echo ============================================
echo.
echo This app has NO splash screen - starts with Onboarding
echo.

REM Check if logo file exists
if exist "src\assets\logos\logo.png" (
    echo [OK] Logo file found: src\assets\logos\logo.png
    echo.
    echo Copying logo to assets folder...
    copy "src\assets\logos\logo.png" "assets\icon.png"
) else (
    echo [INFO] Logo file not found yet
    echo.
    echo Please copy your logo file to:
    echo   src\assets\logos\logo.png
    echo.
    echo Then rename it to: logo.png
    echo.
    echo The logo will also be copied to:
    echo   assets\icon.png (for app icon)
    echo.
)

echo ============================================
echo.
echo Clearing cache...
echo.

call npx expo start -c
echo.

echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo App Icon: Configured
echo Splash Screen: REMOVED
echo First Screen: Onboarding
echo.
pause
