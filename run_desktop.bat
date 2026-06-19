@echo off
title صندوق فروشگاهی سوپرمارکت ده مارکت - اجرا کننده دسکتاپ
color 0B
chcp 65001 > null

echo =========================================================================
echo               صندوق فروشگاهی سوپرمارکت ده مارکت (نسخه آفلاین دسکتاپ)            
echo =========================================================================
echo.

:: Check Node JS installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: نرم افزار پیش نیاز Node.js روی سیستم شما یافت نشد!
    echo لطفا ابتدا Node.js را دانلود و نصب کنید.
    echo آدرس دانلود مستقیم: https://nodejs.org
    echo.
    echo برای باز کردن صفحه دانلود در مرورگر، کلیدی را فشار دهید...
    pause
    start https://nodejs.org
    exit
)

:: Check if node_modules exists
if not exist node_modules (
    echo [INFO] در حال نصب اتصالات و ماژول های پروژه برای اولین بار...
    echo لطفا شکیبا باشید، این کار حدود 1 دقیقه طول می کشد...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo خطا در نصب پیش نیازها. لطفا اتصال اینترنت خود را در اولین اجرا بررسی کنید.
        pause
        exit
    )
)

echo [SUCCESS] پیش نیازها تایید شدند. در حال استارت سرور لایو فروشگاهی بر روی سیستم...
echo برنامه پس از استارت به صورت خودکار در مرورگر پیش فرض شما اجرا خواهد شد.
echo.

:: Open browser after 2 seconds
timeout /t 2 >nul
start http://localhost:3000

:: Run the dev server
call npm run dev

pause
