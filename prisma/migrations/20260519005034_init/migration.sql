/*
  Warnings:

  - You are about to drop the column `scheduleId` on the `QRToken` table. All the data in the column will be lost.
  - Added the required column `studentId` to the `QRToken` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Concept" AS ENUM ('NS', 'ANS', 'BOM', 'OTIMO', 'EXCELENTE');

-- DropForeignKey
ALTER TABLE "QRToken" DROP CONSTRAINT "QRToken_scheduleId_fkey";

-- AlterTable
ALTER TABLE "QRToken" DROP COLUMN "scheduleId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "concept" "Concept",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QRToken" ADD CONSTRAINT "QRToken_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
