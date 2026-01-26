-- Add new column for G.E Junction
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "geJunction" TEXT;
-- Rename oesophagusGE to oesophagus if desired, or just use it as oesophagus. 
-- For clarity, we can rename it, but it might break existing clients if not deployed together.
-- For now, we will assume oesophagusGE will store Oesophagus data, and geJunction will store G.E. Junction data.

-- Optional: Copy/Split data if needed. For now, defaulting null.
