-- CreateTable
CREATE TABLE "subsidy_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "created_by" UUID,
    "application_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'collecting_docs',
    "subsidy_type" TEXT NOT NULL DEFAULT 'ibi',
    "region" TEXT NOT NULL,
    "province" TEXT,
    "municipality" TEXT,
    "estimated_amount" DECIMAL(12,2),
    "approved_amount" DECIMAL(12,2),
    "project_cost" DECIMAL(12,2),
    "submission_deadline" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "approved_at" TIMESTAMPTZ(6),
    "rejected_at" TIMESTAMPTZ(6),
    "required_docs" JSONB DEFAULT '[]',
    "notes" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subsidy_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subsidy_applications_application_number_key" ON "subsidy_applications"("application_number");

-- CreateIndex
CREATE INDEX "subsidy_applications_organization_id_status_idx" ON "subsidy_applications"("organization_id", "status");

-- CreateIndex
CREATE INDEX "subsidy_applications_organization_id_customer_id_idx" ON "subsidy_applications"("organization_id", "customer_id");

-- CreateIndex
CREATE INDEX "subsidy_applications_submission_deadline_idx" ON "subsidy_applications"("submission_deadline");

-- AddForeignKey
ALTER TABLE "subsidy_applications" ADD CONSTRAINT "subsidy_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subsidy_applications" ADD CONSTRAINT "subsidy_applications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subsidy_applications" ADD CONSTRAINT "subsidy_applications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
