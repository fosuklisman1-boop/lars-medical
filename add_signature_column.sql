-- Add signatureImage column to MedicalReport table (base64 PNG data URL of the
-- doctor's electronic signature; nullable — a blank value means the report is
-- signed physically on the printed copy instead, unchanged from prior behavior)
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "signatureImage" TEXT;
