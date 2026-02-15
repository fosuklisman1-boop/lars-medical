-- Add letterhead column to MedicalReport table
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "letterhead" TEXT DEFAULT 'LARS';
