<div align="center">

<img src="public/logo.jpg" alt="BitVerity Logo" width="160" height="160" />

# BitVerity

### AI-Monitored Programming Platform with Integrated Code Authenticity Detection

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

*A LeetCode-style competitive coding platform that uses multi-model machine learning to detect AI-generated code in real time — ensuring authentic, human-authored solutions.*

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running with Docker](#running-with-docker-compose)
  - [Running Locally](#running-locally-without-docker)
- [AI Detection Pipeline](#-ai-detection-pipeline)
- [API Reference](#-api-reference)
- [Detection Scoring Weights](#-detection-scoring-weights)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**BitVerity** is a full-stack platform that combines a LeetCode-style code-execution environment with a real-time AI code authenticity engine. When a user submits a solution, a microservices pipeline silently:

1. **Executes** the code via Judge0 and validates it against test cases.
2. **Analyses** it through four independent ML detectors — behavioral, code-pattern, fingerprint, and explainability.
3. **Scores** a weighted trust score and renders a detailed detection report back to the user via WebSocket.

The goal is to enforce genuine problem-solving in competitive or academic coding environments.

---

## ✨ Features

| Category | Highlights |
|---|---|
| **Coding Environment** | Monaco Editor, multi-language support, real-time test-case execution via Judge0 |
| **AI Detection** | XGBoost, Isolation Forest, CodeBERT / UniXcoder embeddings, Gemini explainability |
| **Behavioral Biometrics** | Keystroke dynamics, paste detection, idle-time tracking, edit-velocity analysis |
| **Auth** | JWT access/refresh tokens + GitHub OAuth |
| **Real-time** | Socket.io for live verdicts and submission status |
| **Contests** | Time-boxed coding contests with live leaderboard |
| **Explainability** | Gemini 2.0 Flash generates human-readable reasoning for every AI verdict |
| **Security** | Helmet, rate-limiting, bcrypt password hashing, CORS |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│           React 19 + Vite + Tailwind CSS                    │
│    Monaco Editor │ Socket.io-Client │ React Router v7       │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST + WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js API  (Express + Socket.io)             │
│   Auth │ Problems │ Submissions │ Contests │ Leaderboard     │
│   Prisma ORM   │   Winston Logger   │   Rate-limiter         │
└────────┬─────────────────────────────────────┬──────────────┘
         │ PostgreSQL (Prisma)                  │ Redis pub/sub
         ▼                                      ▼
┌────────────────┐              ┌───────────────────────────────┐
│  PostgreSQL 16 │              │   Python Detection Service     │
│  (codeverify)  │              │   FastAPI + Uvicorn            │
└────────────────┘              │                               │
                                │  ┌─────────────────────────┐  │
                                │  │  Behavioral Analyser    │  │
                                │  │  (Isolation Forest)     │  │
                                │  ├─────────────────────────┤  │
                                │  │  Code-Pattern Analyser  │  │
                                │  │  (XGBoost + CodeBERT)   │  │
                                │  ├─────────────────────────┤  │
                                │  │  Fingerprint Service    │  │
                                │  │  (UniXcoder embeddings) │  │
                                │  ├─────────────────────────┤  │
                                │  │  Explainability Engine  │  │
                                │  │  (Gemini 2.0 Flash)     │  │
                                │  └─────────────────────────┘  │
                                └───────────────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | 3 | Utility-first styling |
| Monaco Editor | 4.7 | In-browser code editor |
| Socket.io-client | 4.8 | Real-time verdict streaming |
| React Router | 7 | Client-side routing |
| Axios | 1.15 | HTTP client |
| Lucide React | 1.7 | Icon library |

### Backend (Node.js API)
| Technology | Version | Purpose |
|---|---|---|
| Express | 4.19 | REST API framework |
| Socket.io | 4.7 | WebSocket server |
| Prisma | 5.13 | ORM + migrations |
| PostgreSQL | 16 | Primary database |
| Redis (ioredis) | 5.3 | Pub/sub & caching |
| JWT | 9 | Authentication |
| bcryptjs | 2.4 | Password hashing |
| Helmet | 7 | HTTP security headers |
| Winston | 3.13 | Structured logging |
| Gemini AI SDK | 0.24 | Explainability engine |

### Detection Microservice (Python)
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.111 | Async REST microservice |
| Uvicorn | 0.29 | ASGI server |
| XGBoost | 2.0.3 | Code pattern classification |
| Scikit-learn | 1.4.2 | Isolation Forest (behavioral) |
| Transformers (HuggingFace) | 4.40 | CodeBERT / UniXcoder |
| PyTorch | 2.3 | Deep learning backend |
| SQLAlchemy | 2.0 | Async DB access |
| Redis | 5.0.4 | Verdict caching |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Multi-service orchestration |
| Judge0 CE (RapidAPI) | Sandboxed code execution |
| GitHub OAuth | Social login |

---

## 📁 Project Structure

```
AI code detector/
├── 📄 docker-compose.yml         # Orchestrates all services
├── 📄 index.html                 # Vite HTML entry point
├── 📄 vite.config.js             # Vite configuration
├── 📄 tailwind.config.js         # Tailwind CSS config
│
├── 📂 src/                       # React frontend
│   ├── App.jsx                   # Root component & routing
│   ├── main.jsx                  # Vite entry
│   ├── 📂 pages/
│   │   ├── Landing.jsx           # Marketing landing page
│   │   ├── Login.jsx             # Auth pages
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx         # User dashboard
│   │   ├── Problems.jsx          # Problem browser
│   │   ├── Workspace.jsx         # Monaco coding environment
│   │   ├── Contest.jsx           # Live contest page
│   │   ├── Results.jsx           # AI detection report
│   │   ├── Leaderboard.jsx
│   │   └── Profile.jsx
│   ├── 📂 components/            # Reusable UI components
│   ├── 📂 hooks/                 # Custom React hooks
│   ├── 📂 utils/                 # Helper utilities
│   └── 📂 styles/                # Global CSS
│
├── 📂 backend/                   # Node.js REST API
│   ├── 📂 src/
│   │   ├── index.js              # Express + Socket.io bootstrap
│   │   ├── 📂 controllers/       # Route handlers
│   │   ├── 📂 routes/            # Express routers
│   │   ├── 📂 middleware/        # Auth, rate-limit, validation
│   │   ├── 📂 socket/            # Socket.io event handlers
│   │   ├── 📂 lib/               # Prisma client, Redis client
│   │   └── 📂 utils/             # Helpers
│   ├── 📂 prisma/
│   │   ├── schema.prisma         # Database schema
│   │   ├── seed.js               # Sample problems & test cases
│   │   └── 📂 migrations/
│   └── Dockerfile
│
├── 📂 detection-service/         # Python AI microservice
│   ├── main.py                   # FastAPI app entry
│   ├── requirements.txt
│   ├── 📂 services/
│   │   ├── behavioral.py         # Isolation Forest analyser
│   │   ├── code_pattern.py       # XGBoost + CodeBERT
│   │   ├── fingerprint.py        # UniXcoder embeddings
│   │   └── scorer.py             # Weighted score aggregator
│   ├── 📂 routers/               # API route definitions
│   ├── 📂 models/                # Pydantic schemas
│   ├── 📂 db/                    # Async SQLAlchemy setup
│   └── Dockerfile
│
└── 📂 public/                    # Static assets
    └── logo.jpg
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 20+ |
| Python | 3.11+ |
| Docker Desktop | 24+ |
| Git | any |

### Environment Variables

#### `backend/.env`
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/codeverify?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Judge0 (RapidAPI)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_key

# Detection microservice
DETECTION_SERVICE_URL=http://localhost:8000

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# App
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

#### `detection-service/.env`
```env
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/codeverify
REDIS_URL=redis://localhost:6379
CODEBERT_MODEL=microsoft/codebert-base
PORT=8000
ENV=development

# Detection weights (must sum to 1.0)
WEIGHT_BEHAVIORAL=0.30
WEIGHT_CODE_PATTERN=0.35
WEIGHT_FINGERPRINT=0.25
WEIGHT_EXPLAINABILITY=0.10

# Verdict thresholds
THRESHOLD_AI=0.75
THRESHOLD_SUSPICIOUS=0.45
```

### Running with Docker Compose

The easiest way to get everything running with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/Abenanthan/BitVerity-AI-Monitored-Programming-Platform-with-Integrated-Code-Authenticity-Detection.git
cd BitVerity-AI-Monitored-Programming-Platform-with-Integrated-Code-Authenticity-Detection

# 2. Copy and fill in environment files
cp backend/.env.example backend/.env
cp detection-service/.env.example detection-service/.env
# Edit both .env files with your API keys

# 3. Start all services (PostgreSQL, Redis, API, Detection)
docker compose up --build

# 4. Seed the database with problems and test cases
docker exec codeverify_api node prisma/seed.js

# 5. Start the frontend dev server
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Running Locally (Without Docker)

#### 1 — Start PostgreSQL & Redis

```bash
# Using Docker for just the databases
docker run -d --name pg -e POSTGRES_PASSWORD=password -e POSTGRES_DB=codeverify -p 5432:5432 postgres:16-alpine
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

#### 2 — Backend API

```bash
cd backend
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev          # http://localhost:5000
```

#### 3 — Python Detection Service

```bash
cd detection-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 4 — React Frontend

```bash
# From project root
npm install
npm run dev          # http://localhost:5173
```

---

## 🤖 AI Detection Pipeline

When a user submits code, the following 4-stage pipeline runs asynchronously:

```
Submission
    │
    ▼
┌───────────────────────────────────────────────────────┐
│  Stage 1 — Behavioral Analysis (Weight: 30%)          │
│  • Keystroke speed & consistency                      │
│  • Paste events & session idle time                   │
│  • Edit velocity patterns                             │
│  • Model: Isolation Forest (Scikit-learn)             │
└────────────────────────┬──────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────┐
│  Stage 2 — Code Pattern Analysis (Weight: 35%)        │
│  • Structural features (AST-level heuristics)         │
│  • Semantic embeddings via CodeBERT                   │
│  • Classification: XGBoost                            │
└────────────────────────┬──────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────┐
│  Stage 3 — Code Fingerprinting (Weight: 25%)          │
│  • UniXcoder cross-modal embeddings                   │
│  • Cosine similarity against known AI-generated code  │
│  • Embedding-space anomaly detection                  │
└────────────────────────┬──────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────┐
│  Stage 4 — Explainability (Weight: 10%)               │
│  • Gemini 2.0 Flash generates human-readable report   │
│  • Highlights suspicious patterns in the code         │
│  • Contributes calibration signal to final score      │
└────────────────────────┬──────────────────────────────┘
                         │
                         ▼
              Weighted Score Aggregation
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      score ≥ 0.75   score ≥ 0.45   score < 0.45
      AI GENERATED   SUSPICIOUS     HUMAN / TRUSTED
```

The final verdict and full report are pushed via **Socket.io** to the client in real time.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login & receive JWT tokens |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Invalidate refresh token |
| `GET` | `/api/auth/github` | GitHub OAuth redirect |
| `GET` | `/api/auth/github/callback` | GitHub OAuth callback |

### Problems
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/problems` | List all problems |
| `GET` | `/api/problems/:id` | Get problem details |

### Submissions
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/submissions` | Submit code for execution + AI detection |
| `GET` | `/api/submissions/:id` | Get submission result |
| `GET` | `/api/submissions/user/me` | My submission history |

### Contests
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/contests` | List contests |
| `GET` | `/api/contests/:id` | Contest details & problems |
| `GET` | `/api/contests/:id/leaderboard` | Live leaderboard |

### Detection Service (Internal)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/detect` | Analyse code + behavioral data |
| `GET` | `/health` | Service health check |

---

## ⚖️ Detection Scoring Weights

| Analyser | Default Weight | Model |
|---|---|---|
| Code Pattern | **35%** | XGBoost + CodeBERT |
| Behavioral | **30%** | Isolation Forest |
| Fingerprint | **25%** | UniXcoder embeddings |
| Explainability | **10%** | Gemini 2.0 Flash |

> Weights are configurable via `WEIGHT_*` environment variables in the detection service. All four values must sum to `1.0`.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by **Abenanthan (Balaji)**

*BitVerity — Trust the Code. Verify the Coder.*

</div>
