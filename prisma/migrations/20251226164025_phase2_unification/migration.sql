-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "crm_account_id" UUID;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "severity" TEXT NOT NULL DEFAULT 'INFO';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "crm_account_id" UUID;

-- CreateTable
CREATE TABLE "crm_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'customer',
    "status" TEXT NOT NULL DEFAULT 'active',
    "name" TEXT NOT NULL,
    "tax_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "billing_address" JSONB,
    "shipping_address" JSONB,
    "assigned_to" UUID,
    "notes" TEXT,
    "tags" TEXT[],
    "rating" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "crm_account_id" UUID,
    "quote_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issue_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" DATE,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" DECIMAL(12,2) DEFAULT 0,
    "tax_amount" DECIMAL(12,2) DEFAULT 0,
    "total" DECIMAL(12,2) DEFAULT 0,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quote_id" UUID NOT NULL,
    "line_order" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_percentage" DECIMAL(5,2) DEFAULT 0,
    "tax_rate" DECIMAL(5,2) DEFAULT 21,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_accounts_organization_id_type_idx" ON "crm_accounts"("organization_id", "type");

-- CreateIndex
CREATE INDEX "crm_accounts_organization_id_name_idx" ON "crm_accounts"("organization_id", "name");

-- CreateIndex
CREATE INDEX "crm_accounts_email_idx" ON "crm_accounts"("email");

-- CreateIndex
CREATE INDEX "quotes_organization_id_status_idx" ON "quotes"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_organization_id_quote_number_key" ON "quotes"("organization_id", "quote_number");

-- CreateIndex
CREATE INDEX "quote_lines_quote_id_idx" ON "quote_lines"("quote_id");

-- AddForeignKey
ALTER TABLE "crm_accounts" ADD CONSTRAINT "crm_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_accounts" ADD CONSTRAINT "crm_accounts_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_crm_account_id_fkey" FOREIGN KEY ("crm_account_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_crm_account_id_fkey" FOREIGN KEY ("crm_account_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_crm_account_id_fkey" FOREIGN KEY ("crm_account_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
