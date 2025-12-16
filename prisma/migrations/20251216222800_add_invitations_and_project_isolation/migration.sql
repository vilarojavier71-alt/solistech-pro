/*
  Warnings:

  - A unique constraint covering the columns `[portal_user_id]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "portal_user_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "projects_portal_user_id_key" ON "projects"("portal_user_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
