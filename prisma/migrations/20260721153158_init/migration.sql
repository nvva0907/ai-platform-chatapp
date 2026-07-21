-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'assistant', 'system');

-- CreateTable
CREATE TABLE "threads" (
    "id" UUID NOT NULL,
    "anonymousId" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255),
    "email" VARCHAR(255),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "content" TEXT NOT NULL,
    "files" JSONB NOT NULL DEFAULT '[]',
    "akagentRunId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "threads_anonymousId_lastMessageAt_idx" ON "threads"("anonymousId", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "messages_threadId_createdAt_idx" ON "messages"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
