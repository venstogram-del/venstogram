@echo off
cd /d "%~dp0"
echo ========================================================================
echo          UPLOADING VENSTOGRAM TO GITHUB (venstogram-del/venstogram)
echo ========================================================================
echo.
echo Please confirm authorization in the browser if prompted...
echo.
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================================
    echo  SUCCESS! Files successfully uploaded to:
    echo  https://github.com/venstogram-del/venstogram
    echo ========================================================================
) else (
    echo ========================================================================
    echo  ERROR: Push failed with code %errorlevel%.
    echo ========================================================================
)
echo.
pause
