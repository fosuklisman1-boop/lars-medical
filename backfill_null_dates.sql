-- One-time backfill: some legacy MedicalReport rows may have a null `date`
-- (the column the app and the admin dashboard both use as the report/visit
-- timestamp). Where that's the case, fall back to `createdAt` so those
-- reports are correctly ordered and counted everywhere `date` is used.
-- Safe to run multiple times (only touches rows where date IS NULL).
UPDATE "MedicalReport" SET "date" = "createdAt" WHERE "date" IS NULL AND "createdAt" IS NOT NULL;
