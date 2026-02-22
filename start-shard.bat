@echo off
title Cumhuriyet RP Bot - Shard Manager
color 0A

echo ========================================
echo   Cumhuriyet RP Bot - Shard System
echo ========================================
echo.

:: Argüman kontrolü
if "%1"=="" (
    echo Varsayilan 3 shard ile baslatiliyor...
    echo Kullanim: start-shard.bat [sayi] veya start-shard.bat auto
    set SHARD_ARG=
) else (
    echo %1 shard ile baslatiliyor...
    set SHARD_ARG=%1
)

echo.
echo Bot ve Admin Panel baslatiliyor...
echo.

:: Admin paneli ve shard manager'ı aynı anda çalıştır
npx concurrently "node shard.js %SHARD_ARG%" "node panel/server.js"

pause
