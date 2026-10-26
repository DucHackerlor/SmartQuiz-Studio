@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "CAI_DAT_GROQ.ps1" (
  echo [ERROR] Khong tim thay CAI_DAT_GROQ.ps1. Vui long giai nen DAY DU file ZIP.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CAI_DAT_GROQ.ps1"
if errorlevel 1 (
  echo [ERROR] Khong the cau hinh Groq AI. Gui anh ket qua (CHE key).
) else (
  echo [OK] Da cau hinh xong! Buoc tiep theo: chay 2_CHAY_SMARTQUIZ.bat
)
pause
