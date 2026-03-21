-- AlterTable
ALTER TABLE "WorkflowRun"
ADD COLUMN "pauseRequestedAt" TIMESTAMP(3),
ADD COLUMN "pausedAt" TIMESTAMP(3),
ADD COLUMN "pauseReason" TEXT,
ADD COLUMN "resumeRequestedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UnresolvedAutomationItem" (
    "id" TEXT NOT NULL,
    "automationSessionId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT,
    "fieldType" TEXT NOT NULL,
    "questionText" TEXT,
    "status" TEXT NOT NULL,
    "resolutionKind" TEXT,
    "failureReason" TEXT,
    "source" TEXT,
    "suggestedValue" TEXT,
    "metadata" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnresolvedAutomationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnresolvedAutomationItem_automationSessionId_createdAt_idx"
ON "UnresolvedAutomationItem"("automationSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "UnresolvedAutomationItem_applicationId_createdAt_idx"
ON "UnresolvedAutomationItem"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "UnresolvedAutomationItem_applicationId_fieldName_status_idx"
ON "UnresolvedAutomationItem"("applicationId", "fieldName", "status");

-- CreateIndex
CREATE INDEX "UnresolvedAutomationItem_status_createdAt_idx"
ON "UnresolvedAutomationItem"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "UnresolvedAutomationItem"
ADD CONSTRAINT "UnresolvedAutomationItem_automationSessionId_fkey"
FOREIGN KEY ("automationSessionId") REFERENCES "AutomationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnresolvedAutomationItem"
ADD CONSTRAINT "UnresolvedAutomationItem_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
