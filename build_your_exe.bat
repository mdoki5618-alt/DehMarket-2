@echo off
title ساخت فایل اجرایی دسکتاپ - سوپرمارکت ده مارکت
color 0B
chcp 65001 > nul

echo =========================================================================
echo             ابزار خودکار ساخت فایل اجرایی آفلاین (EXE) ده مارکت
echo =========================================================================
echo.

:: 1. Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ خطا: نرم‌افزار پیش‌نیاز Node.js روی کامپیوتر شما نصب نیست!
    echo برای ساخت فایل EXE باید Node.js را نصب داشته باشید.
    echo.
    echo من اکنون به صورت خودکار سایت رسمی دانلود Node.js را برای شما باز می‌کنم. 
    echo لطفا نسخه LTS را دانلود و دکمه‌های Next را بزنید تا نصب شود. سپس دوباره این فایل را اجرا کنید.
    echo.
    echo جهت باز شدن سایت دانلود، یک دکمه را فشار دهید...
    pause
    start https://nodejs.org
    exit
)

echo [۱/۵] پیش‌نیاز Node.js تایید شد.
echo.

:: 2. Install standard dependencies
echo [۲/۵] در حال نصب و همگام‌سازی کدهای فروشگاه... این کار ممکن است ۲ دقیقه طول بکشد...
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo ❌ خطا در همگام‌سازی کدها. لطفا اتصال اینترنت خود را در اولین اجرا بررسی نمایید.
    pause
    exit
)
echo ✅ کدهای پایه با موفقیت نصب شدند.
echo.

:: 3. Install Electron packages
echo [۳/۵] در حال نصب ابزارهای تبدیل به فایل اجرایی ویندوز (Electron ^& Builder)...
call npm install --save-dev electron electron-builder
if %errorlevel% neq 0 (
    color 0C
    echo ❌ خطا در دانلود ابزارهای دسکتاپ. لطفا شکیبایی نموده و اینترنت پایدار را چک کنید.
    pause
    exit
)
echo ✅ موتور شبیه‌ساز دسکتاپ با موفقیت آماده شد.
echo.

:: 4. Build application assets
echo [۴/۵] در حال کامپایل و فشرده‌سازی صفحات فروشگاه برای دسکتاپ...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo ❌ خطای کامپایل. لطفا کدها را دستکاری نکنید.
    pause
    exit
)
echo ✅ عملیات کامپایل با موفقیت انجام شد.
echo.

:: 5. Create Standalone Portable EXE File
echo [۵/۵] در حال پکیج کردن نهایی و ساخت فایلهای تک کاره EXE در پوشه desktop-output...
echo لطفا سیستم را تا پایان پیام موفقیت نبندید...
call npx electron-builder --win --portable
if %errorlevel% neq 0 (
    color 0C
    echo ❌ خطا در تولید برنامه نهایی EXE. 
    pause
    exit
)

echo.
echo =========================================================================
echo ⭐ تبریک! پروسه ساخت فایل پورتابل اجرایی با موفقیت پایان یافت!  ⭐
echo =========================================================================
echo.
echo 📁 فایل تک کاره اجرایی نهایی شما با نام DehMarket_POS.exe تولید شد.
echo 📍 این فایل در پوشه زیر قرار گرفته است:
echo     [ desktop-output \ DehMarket_POS.exe ]
echo.
echo 💡 کار نهایی: کافیست وارد پوشه "desktop-output" شده و روی فایل "DehMarket_POS.exe" 
echo راست کلیک کرده و گزینه Send to -> Desktop را برای راحتی کار بفشارید.
echo.
echo برای باز شدن خودکار پوشه خروجی فاکتورها، یک دکمه را فشار دهید...
pause
start "" "desktop-output"
exit
