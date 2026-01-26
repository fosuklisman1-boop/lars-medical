-- Add columns for Biopsy details
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "biopsy" TEXT; -- 'YES' or 'NO'
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "biopsySite" TEXT;
