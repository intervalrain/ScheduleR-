-- CreateEnum
CREATE TYPE "SprintType" AS ENUM ('PROJECT', 'CASUAL');

-- AlterTable
ALTER TABLE "Sprint" ADD COLUMN     "defaultWorkDays" JSONB NOT NULL DEFAULT '[1,2,3,4,5]',
ADD COLUMN     "defaultWorkHours" JSONB NOT NULL DEFAULT '{"start":"08:30","end":"17:30"}',
ADD COLUMN     "type" "SprintType" NOT NULL DEFAULT 'PROJECT';
