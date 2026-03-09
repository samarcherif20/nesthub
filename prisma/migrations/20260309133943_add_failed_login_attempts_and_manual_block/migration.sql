-- AlterEnum
ALTER TYPE "AccountStatus" ADD VALUE 'ANUALLY_BLOCKED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
