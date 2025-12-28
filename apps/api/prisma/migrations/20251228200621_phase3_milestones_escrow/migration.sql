-- CreateEnum
CREATE TYPE "ContractMilestoneStatus" AS ENUM ('DRAFT', 'FUNDED', 'RELEASED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "LedgerEntryType" ADD VALUE 'ESCROW_DEPOSIT';

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "milestoneId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "milestoneId" TEXT;

-- CreateTable
CREATE TABLE "ContractMilestone" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "status" "ContractMilestoneStatus" NOT NULL DEFAULT 'DRAFT',
    "fundedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractMilestone_contractId_createdAt_idx" ON "ContractMilestone"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractMilestone_status_createdAt_idx" ON "ContractMilestone"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_milestoneId_createdAt_idx" ON "LedgerEntry"("milestoneId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_milestoneId_createdAt_idx" ON "Payment"("milestoneId", "createdAt");

-- AddForeignKey
ALTER TABLE "ContractMilestone" ADD CONSTRAINT "ContractMilestone_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ContractMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ContractMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
