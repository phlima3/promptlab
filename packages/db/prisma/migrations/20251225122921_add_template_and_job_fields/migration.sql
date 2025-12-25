/*
  Warnings:

  - Added the required column `inputHash` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templateId` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "inputHash" TEXT NOT NULL,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "templateId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "variablesSchema" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Template_createdAt_idx" ON "Template"("createdAt");

-- CreateIndex
CREATE INDEX "Job_status_createdAt_idx" ON "Job"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Job_inputHash_idx" ON "Job"("inputHash");

-- CreateIndex
CREATE INDEX "Job_templateId_idx" ON "Job"("templateId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
