-- Add new columns for the split diagnostic test fields
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "testType" TEXT DEFAULT 'HUT Test Result';
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "testResult" TEXT;

-- Optional: Migrate existing data if you have any
-- UPDATE "MedicalReport" 
-- SET "testType" = 'HUT Test Result', 
--     "testResult" = split_part("hutTestResult", ': ', 2)
-- WHERE "hutTestResult" IS NOT NULL;
