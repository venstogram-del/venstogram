@echo off
chcp 65001 >nul
title Venstogram Bot ^& Server
color 0b

:: Переходим в папку со скриптом
cd /d "%~dp0"

echo ========================================================================
echo          🚀 ЗАПУСК VENSTOGRAM BOT ^& MINI APP ECOSYSTEM
echo ========================================================================
echo.

:: Поиск Python
set "PY_CMD="

where python >nul 2>&1
if %errorlevel% equ 0 (
    set "PY_CMD=python"
) else (
    where py >nul 2>&1
    if %errorlevel% equ 0 (
        set "PY_CMD=py -3"
    )
)

if "%PY_CMD%"=="" (
    color 0c
    echo [ОШИБКА] Python не найден в системе!
    echo Убедитесь, что Python установлен и добавлен в PATH.
    echo Скачать: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [1/3] Python обнаружен:
%PY_CMD% --version
echo.

:: Активация виртуального окружения, если оно создано
if exist "venv\Scripts\activate.bat" (
    echo [2/3] Подключение виртуального окружения (venv)...
    call venv\Scripts\activate.bat
    set "PY_CMD=python"
) else if exist ".venv\Scripts\activate.bat" (
    echo [2/3] Подключение виртуального окружения (.venv)...
    call .venv\Scripts\activate.bat
    set "PY_CMD=python"
) else (
    echo [2/3] Использование установленного интерпретатора Python...
)

echo.
echo [3/3] Запуск бота и веб-сервера...
echo.
echo ------------------------------------------------------------------------
echo   Для остановки бота нажмите клавиши: CTRL + C
echo ------------------------------------------------------------------------
echo.

%PY_CMD% run.py

if %errorlevel% neq 0 (
    echo.
    echo ========================================================================
    color 0c
    echo [!] Бот завершил работу с кодом ошибки %errorlevel%.
    echo Если отсутствуют необходимые модули, выполните:
    echo     %PY_CMD% -m pip install -r requirements.txt
    echo ========================================================================
)

echo.
echo Окно закрывается. Нажмите любую клавишу...
pause >nul
