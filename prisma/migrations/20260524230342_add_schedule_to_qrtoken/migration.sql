/*
  Warnings:

  - Added the required column `scheduleId` to the `QRToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QRToken" DROP CONSTRAINT "QRToken_studentId_fkey";

-- AlterTable
ALTER TABLE "QRToken" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "scheduleId" TEXT NOT NULL,
ALTER COLUMN "studentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "QRToken" ADD CONSTRAINT "QRToken_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRToken" ADD CONSTRAINT "QRToken_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
