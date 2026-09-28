-- Reusable signature library: admin can save a drawn/uploaded signature once
-- (with a label like "Dr. Adams") and pick it again on future reports instead
-- of redrawing every time. Same RLS pattern as Client/MedicalReport: public
-- can read/create, no public delete policy (deletes go through the
-- service-role client, same as MedicalReport deletes).
CREATE TABLE IF NOT EXISTS "SavedSignature" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "label" text NOT NULL,
    "imageData" text NOT NULL,
    "createdAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "SavedSignature" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "SavedSignature"
    FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert access for all users" ON "SavedSignature"
    FOR INSERT TO public WITH CHECK (true);
