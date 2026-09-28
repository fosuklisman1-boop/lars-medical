-- Add amount column to MedicalReport table (GH₵ charged for the visit; admin-only, never shown on the printed/shared report)
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "amount" NUMERIC;
