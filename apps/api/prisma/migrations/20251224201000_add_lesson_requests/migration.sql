-- Add lesson request flow (parent/student -> tutor)

-- Create enum for status
DO $$ BEGIN
  CREATE TYPE "LessonRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create table
CREATE TABLE IF NOT EXISTS "LessonRequest" (
  "id" TEXT NOT NULL,
  "tutorId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "LessonRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LessonRequest_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "LessonRequest" ADD CONSTRAINT "LessonRequest_tutorId_fkey"
    FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "LessonRequest" ADD CONSTRAINT "LessonRequest_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "LessonRequest_tutorId_createdAt_idx" ON "LessonRequest"("tutorId", "createdAt");
CREATE INDEX IF NOT EXISTS "LessonRequest_requesterId_createdAt_idx" ON "LessonRequest"("requesterId", "createdAt");
