-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "address" TEXT,
    "dateOfRegistration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refDoctor" TEXT,
    "procedure" TEXT,
    "operationTeam" TEXT[],
    "timeStarted" TIMESTAMP(3),
    "timeEnded" TIMESTAMP(3),
    "medicationGiven" TEXT,
    "instrumentsUsed" TEXT[],
    "clinicalSummary" TEXT,
    "findings" TEXT,
    "hutTestResult" TEXT,
    "impression" TEXT,
    "comments" TEXT,
    "medication" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientId_key" ON "Client"("clientId");

-- CreateIndex
CREATE INDEX "Client_clientId_idx" ON "Client"("clientId");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Client_dateOfRegistration_idx" ON "Client"("dateOfRegistration");
