@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ===================================================
echo   SMARTQUIZ V5 - GROQ FREE - WINDOWS
echo ===================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Chua cai Node.js. Hay cai Node 24 LTS.
  pause
  exit /b 1
)
node -e "let v=process.versions.node.split('.').map(Number);process.exit(v[0]>22 || (v[0]===22 && v[1]>=13)?0:1)"
if errorlevel 1 (
  echo [ERROR] Phien ban Node qua cu. Can Node.js 22.13+; khuyen nghi Node.js 24 LTS.
  pause
  exit /b 1
)
if not exist "apps\api\.env" copy "apps\api\.env.example" "apps\api\.env" >nul
if not exist "apps\web\.env" copy "apps\web\.env.example" "apps\web\.env" >nul
if not exist "node_modules" (
  echo [INFO] Dang cai dependency lan dau...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install that bai, vui long gui anh terminal.
    pause
    exit /b 1
  )
)
echo [INFO] Kiem tra moi truong...
call npm run doctor
echo [INFO] Website: http://localhost:5173
 echo [INFO] API: http://localhost:3000/api/health
 echo [INFO] Dung server: Ctrl+C
call npm run dev
if errorlevel 1 echo [ERROR] Khong khoi dong duoc; gui anh terminal cho tro ly.
pause
