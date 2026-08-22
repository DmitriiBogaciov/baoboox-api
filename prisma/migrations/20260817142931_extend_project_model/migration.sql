/*
  Warnings:

  - The `language` column on the `projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "language",
ADD COLUMN     "language" "ProjectLanguage" NOT NULL DEFAULT 'EN';
