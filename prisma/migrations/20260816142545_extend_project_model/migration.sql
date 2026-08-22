/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "projects_ownerId_slug_key";

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "language" SET DEFAULT 'en';

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");
