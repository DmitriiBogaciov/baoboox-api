/*
  Warnings:

  - Added the required column `actorId` to the `project_moderation_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextStatus` to the `project_moderation_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "project_moderation_logs_projectId_idx";

-- AlterTable
ALTER TABLE "project_moderation_logs" ADD COLUMN     "actorId" TEXT NOT NULL,
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "nextStatus" "ProjectStatus" NOT NULL,
ADD COLUMN     "previousStatus" "ProjectStatus";

-- CreateIndex
CREATE INDEX "project_moderation_logs_projectId_createdAt_idx" ON "project_moderation_logs"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_moderation_logs_actorId_idx" ON "project_moderation_logs"("actorId");

-- AddForeignKey
ALTER TABLE "project_moderation_logs" ADD CONSTRAINT "project_moderation_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
