@echo off
title Cumhuriyet RP Bot - Normal Mode
color 0B

echo ========================================
echo   Cumhuriyet RP Bot - Normal Mode
echo ========================================
echo.
echo Bot ve Admin Panel baslatiliyor...
echo.

:: Admin paneli ve botu normal modda çalıştır (shard olmadan)
npx concurrently "node index.js" "node panel/server.js"

pause
