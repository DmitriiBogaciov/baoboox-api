-- CreateEnum
CREATE TYPE "ProjectModerationAction" AS ENUM ('PUBLISHED', 'UNPUBLISHED', 'REJECTED', 'BLOCKED', 'ARCHIVED', 'UNBLOCKED');

-- CreateTable
CREATE TABLE "project_moderation_logs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "action" "ProjectModerationAction" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_moderation_logs_projectId_idx" ON "project_moderation_logs"("projectId");

-- CreateIndex
CREATE INDEX "project_moderation_logs_action_idx" ON "project_moderation_logs"("action");

-- AddForeignKey
ALTER TABLE "project_moderation_logs" ADD CONSTRAINT "project_moderation_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
