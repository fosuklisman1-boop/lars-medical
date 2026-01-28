-- Add columns for Lower Endoscopy (Colonoscopy) findings
ALTER TABLE "MedicalReport"
ADD COLUMN IF NOT EXISTS "dre" TEXT, -- Digit Rectal Examination
ADD COLUMN IF NOT EXISTS "anus" TEXT,
ADD COLUMN IF NOT EXISTS "rectum" TEXT,
ADD COLUMN IF NOT EXISTS "sigmoid" TEXT,
ADD COLUMN IF NOT EXISTS "descendingColon" TEXT,
ADD COLUMN IF NOT EXISTS "splenicFlexure" TEXT,
ADD COLUMN IF NOT EXISTS "transverseColon" TEXT,
ADD COLUMN IF NOT EXISTS "hepaticFlexure" TEXT,
ADD COLUMN IF NOT EXISTS "ascendingColon" TEXT,
ADD COLUMN IF NOT EXISTS "caecum" TEXT,
ADD COLUMN IF NOT EXISTS "ileoCaecalValve" TEXT;
