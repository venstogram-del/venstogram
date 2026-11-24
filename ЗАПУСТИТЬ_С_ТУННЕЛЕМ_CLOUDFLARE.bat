@echo off
chcp 65001 >nul
title Venstogram (Бот + Cloudflare Туннель)
color 0a

cd /d "%~dp0"

echo ========================================================================
echo   🚀 ЗАПУСК VENSTOGRAM (СЕРВЕР + БОТ + ПУБЛИЧНЫЙ HTTPS ТУННЕЛЬ)
echo ========================================================================
echo.
echo [1/2] Запуск Cloudflare HTTPS туннеля в отдельном окне...
echo       (Это нужно для работы Telegram Mini App на смартфонах)
echo.

if exist "cloudflared.exe" (
    start "Cloudflare Tunnel (Venstogram)" cmd /k "cloudflared.exe tunnel --url http://localhost:8000"
) else (
    echo [Внимание] cloudflared.exe не найден в папке.
)

echo.
echo [2/2] Запуск сервера и Telegram бота...
echo ========================================================================
echo.

call "ЗАПУСТИТЬ_БОТА.bat"
