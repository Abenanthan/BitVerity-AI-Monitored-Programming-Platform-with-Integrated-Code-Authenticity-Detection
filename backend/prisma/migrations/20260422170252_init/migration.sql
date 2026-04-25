-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'COMPILE_ERROR', 'RUNTIME_ERROR');

-- CreateEnum
CREATE TYPE "AiVerdict" AS ENUM ('HUMAN', 'SUSPICIOUS', 'AI_GENERATED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "githubId" VARCHAR(100),
    "avatarUrl" TEXT,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "totalSolved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "topics" TEXT[],
    "constraints" TEXT NOT NULL,
    "sampleInput" TEXT NOT NULL,
    "sampleOutput" TEXT NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "memoryLimit" INTEGER NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalAccepted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "contestId" UUID,
    "code" TEXT NOT NULL,
    "language" VARCHAR(20) NOT NULL,
    "verdict" "Verdict" NOT NULL DEFAULT 'PENDING',
    "runtime" INTEGER,
    "memory" INTEGER,
    "aiScore" DOUBLE PRECISION,
    "aiVerdict" "AiVerdict",
    "behaviorLogId" UUID,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detection_reports" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "behavioralScore" DOUBLE PRECISION NOT NULL,
    "codePatternScore" DOUBLE PRECISION NOT NULL,
    "fingerprintScore" DOUBLE PRECISION NOT NULL,
    "explainabilityScore" DOUBLE PRECISION NOT NULL,
    "finalAiScore" DOUBLE PRECISION NOT NULL,
    "aiVerdict" "AiVerdict" NOT NULL,
    "flags" JSONB NOT NULL,
    "trustScoreDelta" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detection_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "avgLineLength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "camelCaseRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "snakeCaseRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "docstringFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commentFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgFuncLength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "preferredLoops" VARCHAR(10) NOT NULL DEFAULT 'for',
    "embeddingVector" DOUBLE PRECISION[],
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contests" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID NOT NULL,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_users" (
    "userId" UUID NOT NULL,
    "contestId" UUID NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_users_pkey" PRIMARY KEY ("userId","contestId")
);

-- CreateTable
CREATE TABLE "contest_problems" (
    "contestId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 100,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contest_problems_pkey" PRIMARY KEY ("contestId","problemId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

-- CreateIndex
CREATE INDEX "problems_slug_idx" ON "problems"("slug");

-- CreateIndex
CREATE INDEX "problems_difficulty_idx" ON "problems"("difficulty");

-- CreateIndex
CREATE INDEX "test_cases_problemId_idx" ON "test_cases"("problemId");

-- CreateIndex
CREATE INDEX "submissions_userId_idx" ON "submissions"("userId");

-- CreateIndex
CREATE INDEX "submissions_problemId_idx" ON "submissions"("problemId");

-- CreateIndex
CREATE INDEX "submissions_contestId_idx" ON "submissions"("contestId");

-- CreateIndex
CREATE INDEX "submissions_verdict_idx" ON "submissions"("verdict");

-- CreateIndex
CREATE INDEX "submissions_aiVerdict_idx" ON "submissions"("aiVerdict");

-- CreateIndex
CREATE INDEX "submissions_submittedAt_idx" ON "submissions"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "detection_reports_submissionId_key" ON "detection_reports"("submissionId");

-- CreateIndex
CREATE INDEX "detection_reports_submissionId_idx" ON "detection_reports"("submissionId");

-- CreateIndex
CREATE INDEX "detection_reports_aiVerdict_idx" ON "detection_reports"("aiVerdict");

-- CreateIndex
CREATE INDEX "detection_reports_finalAiScore_idx" ON "detection_reports"("finalAiScore");

-- CreateIndex
CREATE UNIQUE INDEX "style_profiles_userId_key" ON "style_profiles"("userId");

-- CreateIndex
CREATE INDEX "style_profiles_userId_idx" ON "style_profiles"("userId");

-- CreateIndex
CREATE INDEX "contests_startTime_idx" ON "contests"("startTime");

-- CreateIndex
CREATE INDEX "contests_endTime_idx" ON "contests"("endTime");

-- CreateIndex
CREATE INDEX "contests_createdBy_idx" ON "contests"("createdBy");

-- CreateIndex
CREATE INDEX "contest_users_contestId_idx" ON "contest_users"("contestId");

-- CreateIndex
CREATE INDEX "contest_users_score_idx" ON "contest_users"("score");

-- CreateIndex
CREATE INDEX "contest_problems_contestId_idx" ON "contest_problems"("contestId");

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detection_reports" ADD CONSTRAINT "detection_reports_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_profiles" ADD CONSTRAINT "style_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_users" ADD CONSTRAINT "contest_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_users" ADD CONSTRAINT "contest_users_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_problems" ADD CONSTRAINT "contest_problems_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_problems" ADD CONSTRAINT "contest_problems_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
