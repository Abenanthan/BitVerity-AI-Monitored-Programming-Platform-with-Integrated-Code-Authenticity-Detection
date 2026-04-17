# CodeVerify Backend
# AI-Powered Competitive Coding Platform

A production-ready microservices backend for CodeVerify — an AI-powered competitive coding platform with real-time code authenticity detection.

---

## Architecture

```
Frontend (React/Vite :5173)
        │
        ├── REST API  ──► Node.js Express (:5000)
        └── WebSocket ──► Socket.io (:5000)
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         PostgreSQL          Redis         Python FastAPI
         (primary DB)    (cache/pubsub)   (detection :8000)
```

---

## Quick Start

### Option 1 — Docker (recommended)

```bash
# 1. Copy env files
cp backend/.env.example backend/.env
cp detection-service/.env.example detection-service/.env
# Edit both .env files with your secrets

# 2. Launch everything
docker-compose up --build

# 3. Seed the database (first time only)
docker-compose exec api npm run db:seed
```

### Option 2 — Windows (without Docker)

```bat
start-dev.bat
```

### Option 3 — Linux/macOS (without Docker)

```bash
chmod +x start-dev.sh && ./start-dev.sh
```

---

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Node.js API | http://localhost:5000 | REST API + Socket.io |
| Python Detection | http://localhost:8000 | AI detection microservice |
| API Docs (FastAPI) | http://localhost:8000/docs | Swagger UI (dev only) |
| PostgreSQL | localhost:5432 | Primary database |
| Redis | localhost:6379 | Cache + pub/sub |
| Prisma Studio | `npm run db:studio` | DB browser |

---

## Redis Key Reference

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `refresh:{userId}` | String | 7 days | JWT refresh token store |
| `behavior:{sessionId}` | String (JSON) | 2 hours | Keystroke event buffer |
| `leaderboard:{contestId}` | Sorted Set | persistent | Real-time contest scores |
| `ratelimit:{userId}:submit` | String (int) | 60 seconds | Per-user submission limiter |
| `cache:problem:{slug}` | String (JSON) | 10 minutes | Problem detail cache |
| `cache:user:{userId}` | String (JSON) | 10 minutes | User profile cache |
| `submission:{id}` | Pub/Sub channel | — | Real-time verdict push |
| `detection:{id}` | Pub/Sub channel | — | Real-time AI result push |

---

## API Reference

### Auth — `/api/auth`

| Method | Path | Auth | Body |
|--------|------|------|------|
| POST | `/register` | — | `{ email, username, password }` |
| POST | `/login` | — | `{ email, password }` |
| POST | `/refresh` | — | `{ refreshToken }` |
| POST | `/logout` | ✅ | — |
| GET | `/me` | ✅ | — |
| GET | `/github` | — | OAuth redirect |
| GET | `/github/callback` | — | OAuth callback |

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | ✅ | Cached profile + styleProfile |
| PATCH | `/me` | ✅ | Update avatar |
| GET | `/:username` | — | Public profile |
| GET | `/:username/submissions` | ✅ | User submission history |
| GET | `/leaderboard` | — | Global leaderboard |

### Problems — `/api/problems`

| Method | Path | Query / Body |
|--------|------|------|
| GET | `/` | `?difficulty=EASY&topic=Array&page=1&limit=20` |
| GET | `/:slug` | Redis cached (10min) |
| POST | `/` | ✅ `{ title, slug, description, difficulty, ... }` |

### Submissions — `/api/submissions`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | ✅ Submit code (rate-limited 5/min) |
| GET | `/` or `/my` | ✅ My submissions (filterable) |
| GET | `/:id` | ✅ Submission detail + detection report |

**POST body:**
```json
{
  "problemId": "uuid",
  "contestId": "uuid (optional)",
  "code": "def solution(): ...",
  "language": "python",
  "behaviorLog": [
    { "type": "keypress", "key": "d", "t": 1713251400000 },
    { "type": "paste", "length": 256, "t": 1713251405000 }
  ]
}
```

### Contests — `/api/contests`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | `?phase=upcoming\|ongoing\|past` |
| GET | `/:id` | Contest detail + problems |
| POST | `/` | ✅ Create contest |
| POST | `/:id/join` | ✅ Join contest (seeds leaderboard) |
| GET | `/:id/leaderboard` | Redis ZREVRANGE → top 50 |

### Detection — `/api/detection`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/report/:submissionId` | ✅ Full AI detection report (owner only) |
| POST | `/explain` | ✅ Submit explainability answer → rescores trust |

---

## Detection Pipeline

```
Submit Code
    │
    ├── 1. Rate limit check  (Redis INCR ratelimit:{userId}:submit)
    ├── 2. Save submission   (PostgreSQL — PENDING)
    ├── 3. Store behavior log (Redis SET behavior:{sessionId} TTL 2h)
    ├── 4. → 202 Accepted    (client receives immediately)
    │
    └── [async setImmediate]
            │
            ├── Judge0 API  (all hidden test cases)
            ├── Update verdict (PostgreSQL)
            ├── Update contest leaderboard (Redis ZINCRBY)
            ├── Emit Socket.io: submission:update
            │
            └── [async setImmediate]
                    │
                    └── Python Detection Service
                            ├── Behavioral analyzer  (30%)
                            ├── Code pattern analyzer (35%)
                            ├── Fingerprint analyzer  (25%)
                            └── CodeBERT explainability (10%)
                                    │
                                    ├── Save DetectionReport (PostgreSQL)
                                    ├── Update user trustScore
                                    ├── Update styleProfile (EMA)
                                    └── Emit Socket.io: detection:update
```

---

## Detection Score Weights & Verdicts

| Score Range | Verdict |
|-------------|---------|
| ≥ 0.75 | `AI_GENERATED` |
| 0.45 – 0.74 | `SUSPICIOUS` |
| < 0.45 | `HUMAN` |

| Trust Score Event | Delta |
|-------------------|-------|
| HUMAN verdict | up to +2 |
| SUSPICIOUS verdict | up to -5 |
| AI_GENERATED verdict | up to -20 |
| Explainability challenge pass | up to +5 |

---

## Socket.io Events

**Client → Server:**
```js
socket.emit('watch:submission', submissionId)
socket.emit('unwatch:submission', submissionId)
```

**Server → Client:**
```js
socket.on('submission:update', { id, verdict, runtime, memory })
socket.on('detection:update',  { submissionId, aiVerdict, aiScore })
```

---

## Database Schema

9 PostgreSQL tables managed by Prisma:
`users` · `problems` · `test_cases` · `submissions` · `detection_reports` · `style_profiles` · `contests` · `contest_users` · `contest_problems`

```bash
# View schema
cat backend/prisma/schema.prisma

# Open DB browser
cd backend && npm run db:studio

# Reset + reseed
cd backend && npm run db:reset
```

---

## Project Structure

```
├── backend/                  # Node.js Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (9 tables)
│   │   └── seed.js           # Dev seed data
│   ├── src/
│   │   ├── index.js          # App entry point
│   │   ├── lib/              # prisma.js, redis.js
│   │   ├── utils/            # logger, jwt, AppError
│   │   ├── middleware/       # auth, validate, error, rateLimit
│   │   ├── controllers/      # auth, users, problems, submissions,
│   │   │                     # contests, detection, github
│   │   ├── routes/           # 6 router files
│   │   └── socket/           # Socket.io + Redis pub/sub
│   ├── Dockerfile
│   └── package.json
│
├── detection-service/        # Python FastAPI detection engine
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py         # Pydantic settings
│   │   ├── database.py       # SQLAlchemy engine
│   │   ├── models.py         # ORM models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── analyzers/        # behavioral, code_pattern,
│   │   │                     # fingerprint, explainability
│   │   ├── services/         # detection orchestrator
│   │   └── routes/           # FastAPI routes
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml        # One-command startup
├── start-dev.bat             # Windows dev script
├── start-dev.sh              # Linux/macOS dev script
└── src/                      # Frontend (React/Vite)
```
