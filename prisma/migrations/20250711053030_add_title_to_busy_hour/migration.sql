/*
  Warnings:

  - Added the required column `title` to the `BusyHour` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BusyHour" ADD COLUMN     "title" TEXT NOT NULL;
