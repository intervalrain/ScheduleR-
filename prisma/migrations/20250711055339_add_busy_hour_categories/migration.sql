-- AlterTable
ALTER TABLE "BusyHour" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "BusyHourCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BusyHourCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BusyHour" ADD CONSTRAINT "BusyHour_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusyHourCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusyHourCategory" ADD CONSTRAINT "BusyHourCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
