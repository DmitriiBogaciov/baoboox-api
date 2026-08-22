-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ProjectVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('HANDBOOK', 'GUIDE', 'COURSE', 'INSTRUCTION', 'LECTURE');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "coverUrl" VARCHAR(500),
    "type" "ProjectType" NOT NULL DEFAULT 'GUIDE',
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PRIVATE',
    "language" VARCHAR(10) NOT NULL DEFAULT 'ru',
    "ownerId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");

-- CreateIndex
CREATE INDEX "projects_status_visibility_idx" ON "projects"("status", "visibility");

-- CreateIndex
CREATE INDEX "projects_type_idx" ON "projects"("type");

-- CreateIndex
CREATE UNIQUE INDEX "projects_ownerId_slug_key" ON "projects"("ownerId", "slug");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
