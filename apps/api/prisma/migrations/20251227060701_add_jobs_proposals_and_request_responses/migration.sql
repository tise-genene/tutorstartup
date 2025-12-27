-- CreateEnum
CREATE TYPE "JobPostStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('SUBMITTED', 'WITHDRAWN', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "LessonRequest" ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "tutorResponseFileUrl" TEXT,
ADD COLUMN     "tutorResponseMessage" TEXT,
ADD COLUMN     "tutorResponseVideoUrl" TEXT;

-- CreateTable
CREATE TABLE "JobPost" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "budget" INTEGER,
    "status" "JobPostStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "jobPostId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "fileUrl" TEXT,
    "videoUrl" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobPost_parentId_createdAt_idx" ON "JobPost"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "JobPost_status_createdAt_idx" ON "JobPost"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_tutorId_createdAt_idx" ON "Proposal"("tutorId", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_jobPostId_createdAt_idx" ON "Proposal"("jobPostId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_jobPostId_tutorId_key" ON "Proposal"("jobPostId", "tutorId");

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
