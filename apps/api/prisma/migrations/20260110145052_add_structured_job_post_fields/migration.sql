-- CreateEnum
CREATE TYPE "JobPayType" AS ENUM ('HOURLY', 'MONTHLY', 'FIXED');

-- CreateEnum
CREATE TYPE "GenderPreference" AS ENUM ('ANY', 'MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN     "currency" TEXT DEFAULT 'ETB',
ADD COLUMN     "daysPerWeek" INTEGER,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "fixedAmount" INTEGER,
ADD COLUMN     "genderPreference" "GenderPreference" DEFAULT 'ANY',
ADD COLUMN     "grade" INTEGER,
ADD COLUMN     "hourlyAmount" INTEGER,
ADD COLUMN     "monthlyAmount" INTEGER,
ADD COLUMN     "payType" "JobPayType",
ADD COLUMN     "preferredDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sessionMinutes" INTEGER,
ADD COLUMN     "startTime" TEXT;
