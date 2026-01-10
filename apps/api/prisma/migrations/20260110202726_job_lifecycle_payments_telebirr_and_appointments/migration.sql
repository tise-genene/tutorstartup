-- AlterEnum
ALTER TYPE "JobPostStatus" ADD VALUE 'DRAFT';

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'TELEBIRR';

-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "hiredAt" TIMESTAMP(3),
ADD COLUMN     "hiredTutorId" TEXT,
ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "locationText" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_contractId_startAt_idx" ON "Appointment"("contractId", "startAt");

-- CreateIndex
CREATE INDEX "Appointment_createdByUserId_createdAt_idx" ON "Appointment"("createdByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "JobPost_hiredTutorId_createdAt_idx" ON "JobPost"("hiredTutorId", "createdAt");

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_hiredTutorId_fkey" FOREIGN KEY ("hiredTutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
