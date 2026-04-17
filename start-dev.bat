@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM  CodeVerify — Windows Quick Start (without Docker)
REM  Requires: Node.js 20+, Python 3.11+, PostgreSQL 16, Redis
REM ─────────────────────────────────────────────────────────────────────────────

echo ========================================
echo  CodeVerify Backend Quick Start (Windows)
echo ========================================

REM ── Check .env files ─────────────────────────────────────────────────────────
if not exist "backend\.env" (
    echo [!] backend\.env not found — copying from .env.example
    copy backend\.env.example backend\.env
    echo [!] Please fill in your secrets in backend\.env then re-run this script.
    pause
    exit /b 1
)

if not exist "detection-service\.env" (
    echo [!] detection-service\.env not found — copying from .env.example
    copy detection-service\.env.example detection-service\.env
)

REM ── Install Node.js dependencies ─────────────────────────────────────────────
echo.
echo [1/4] Installing Node.js dependencies...
cd backend
call npm install
if errorlevel 1 ( echo Error during npm install. & pause & exit /b 1 )

REM ── Run Prisma migrations ─────────────────────────────────────────────────────
echo.
echo [2/4] Running Prisma migrations...
call npx prisma migrate dev --name init
if errorlevel 1 ( echo Migration failed. Check DATABASE_URL in backend\.env & pause & exit /b 1 )

REM ── Seed database ────────────────────────────────────────────────────────────
echo.
echo [3/4] Seeding database...
call npm run db:seed
cd ..

REM ── Install Python dependencies ───────────────────────────────────────────────
echo.
echo [4/4] Installing Python dependencies...
cd detection-service
pip install -r requirements.txt
if errorlevel 1 ( echo Python dependency install failed. & pause & exit /b 1 )
cd ..

echo.
echo ========================================
echo  Starting services...
echo  API:       http://localhost:5000
echo  Detection: http://localhost:8000
echo  Docs:      http://localhost:8000/docs
echo ========================================
echo.

REM ── Start both services in separate windows ───────────────────────────────────
start "CodeVerify API" cmd /k "cd backend && npm run dev"
start "CodeVerify Detection" cmd /k "cd detection-service && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Both services started in separate windows.
pause
