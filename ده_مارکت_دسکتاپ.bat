@echo off
title صندوق فروشگاهی ده مارکت (نسخه پرتال دسکتاپ)
color 0B
chcp 65001 > nul

echo =========================================================================
echo       سیستم صندوق فروشگاهی و حسابداری مستقل سوپرمارکت ده مارکت
echo =========================================================================
echo.
echo در حال باز کردن برنامه فروشگاه در حالت اختصاصی دسکتاپ (بدون کادر مرورگر)...
echo لطفا چند ثانیه شکیبا باشید...
echo.

:: 1. Try Google Chrome App Mode (Standard 64-bit)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=https://ais-pre-a6c3d4rbtlfmpmdruduldu-934858354202.europe-west2.run.app
    exit
)

:: 2. Try Google Chrome App Mode (32-bit/Alternative path)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app=https://ais-pre-a6c3d4rbtlfmpmdruduldu-934858354202.europe-west2.run.app
    exit
)

:: 3. Try Microsoft Edge App Mode (Windows 10/11 Default 64-bit)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app=https://ais-pre-a6c3d4rbtlfmpmdruduldu-934858354202.europe-west2.run.app
    exit
)

:: 4. Try Microsoft Edge App Mode (Alternative path)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=https://ais-pre-a6c3d4rbtlfmpmdruduldu-934858354202.europe-west2.run.app
    exit
)

:: 5. Fallback: Launch in default system browser if customized paths
echo [INFO] مرورگر هدف برای حالت App یافت نشد. در حال اجرا در مرورگر پیش فرض سیستم...
start https://ais-pre-a6c3d4rbtlfmpmdruduldu-934858354202.europe-west2.run.app
exit
