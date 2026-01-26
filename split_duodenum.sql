-- Add columns for split Duodenum fields (D1 and D2)
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "d1" TEXT;
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "d2" TEXT;

-- Optional: You might want to migrate existing 'duodenum' data to 'd1' or keep it as legacy.
-- For now, new reports will use d1/d2.
