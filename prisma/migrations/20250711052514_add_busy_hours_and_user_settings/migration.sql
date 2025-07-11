-- AlterTable
ALTER TABLE "User" ADD COLUMN     "settings" JSONB DEFAULT '{"workHours":{"start":"09:00","end":"17:00"},"workDays":[1,2,3,4,5]}';

-- CreateTable
CREATE TABLE "BusyHour" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BusyHour_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BusyHour" ADD CONSTRAINT "BusyHour_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
