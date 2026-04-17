#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  CodeVerify — Linux/macOS Quick Start (without Docker)
# ─────────────────────────────────────────────────────────────────────────────
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================"
echo "  CodeVerify Backend Quick Start"
echo -e "========================================${NC}"

# ── .env files ────────────────────────────────────────────────────────────────
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}[!] backend/.env not found — copying from .env.example${NC}"
  cp backend/.env.example backend/.env
  echo -e "${RED}[!] Fill in your secrets in backend/.env then re-run.${NC}"
  exit 1
fi

[ ! -f "detection-service/.env" ] && cp detection-service/.env.example detection-service/.env

# ── Node.js ───────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}[1/4] Installing Node.js dependencies...${NC}"
cd backend && npm install

echo -e "\n${GREEN}[2/4] Running Prisma migrations...${NC}"
npx prisma migrate dev --name init

echo -e "\n${GREEN}[3/4] Seeding database...${NC}"
npm run db:seed
cd ..

# ── Python ────────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}[4/4] Installing Python dependencies...${NC}"
cd detection-service
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
cd ..

echo -e "\n${GREEN}========================================
  Starting services...
  API:       http://localhost:5000
  Detection: http://localhost:8000
  Docs:      http://localhost:8000/docs
========================================${NC}\n"

# ── Start services ────────────────────────────────────────────────────────────
trap "kill 0" EXIT

(cd backend && npm run dev) &
(cd detection-service && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload) &

wait
