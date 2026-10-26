@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo =================================================
echo   SMARTQUIZ V3 - KIEM THU CHUONG TRINH
echo =================================================
call npm run check:static
if errorlevel 1 goto error
call npm test
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error
echo.
echo [OK] Static + Unit/API tests + React production build OK
echo [TIP] Khi npm run dev dang chay, mo terminal khac va chay: npm run smoke
pause
exit /b 0
:error
echo [LOI] Kiem tra thong bao ngay phia tren.
pause
exit /b 1
