-- Add time tracking fields to Task table
ALTER TABLE "Task" ADD COLUMN "startReviewTime" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "closeTime" TIMESTAMP(3);