-- Convert priority field from String to Int safely
-- First add a new integer column
ALTER TABLE "Task" ADD COLUMN "priority_new" INTEGER;

-- Convert existing string values to integers 
-- Since we verified all existing values are numeric strings
UPDATE "Task" SET "priority_new" = CAST("priority" AS INTEGER) 
WHERE "priority" IS NOT NULL;

-- Drop the old column
ALTER TABLE "Task" DROP COLUMN "priority";

-- Rename the new column to the original name
ALTER TABLE "Task" RENAME COLUMN "priority_new" TO "priority";