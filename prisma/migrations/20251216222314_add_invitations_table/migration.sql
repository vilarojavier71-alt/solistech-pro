-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "is_god_mode" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "activation_date" DATE,
ADD COLUMN     "assigned_technician_id" UUID,
ADD COLUMN     "client_access_token" TEXT,
ADD COLUMN     "client_portal_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contract_url" TEXT,
ADD COLUMN     "engineer_verdict" JSONB,
ADD COLUMN     "expected_completion" DATE,
ADD COLUMN     "installation_date" DATE,
ADD COLUMN     "installation_phase" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "legalization_status" TEXT DEFAULT 'pending',
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "phase_notes" TEXT,
ADD COLUMN     "solar_phase" TEXT NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "total_amount" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "operating_expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "receipt_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operating_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min_quantity" INTEGER DEFAULT 5,
    "unit_price" DECIMAL(12,2),
    "location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" TEXT NOT NULL,
    "permission_slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parent_id" UUID,
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_journals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "accounting_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "journal_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "debit" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmail_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expires_at" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gmail_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_phase_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "from_phase" INTEGER,
    "to_phase" INTEGER NOT NULL,
    "changed_by" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_phase_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transaction_ref" TEXT NOT NULL,
    "payment_method" TEXT,
    "notes" TEXT,
    "processed_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "url" TEXT,
    "file_name" TEXT,
    "rejection_reason" TEXT,
    "uploaded_by" UUID,
    "reviewed_by" UUID,
    "uploaded_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "customer_id" UUID,
    "customer_name" TEXT,
    "dni" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "sale_number" TEXT,
    "amount" DECIMAL(12,2),
    "material" TEXT,
    "created_by" UUID,
    "sale_date" TIMESTAMPTZ(6),
    "payment_method" TEXT,
    "payment_terms" TEXT,
    "payment_status" TEXT DEFAULT 'pending',
    "documentation_status" TEXT DEFAULT 'pending',
    "engineering_status" TEXT DEFAULT 'pending',
    "process_status" TEXT DEFAULT 'not_started',
    "installation_status" TEXT DEFAULT 'pending',
    "documentation_notes" TEXT,
    "access_code" TEXT,
    "canvasser_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "title" TEXT,
    "description" TEXT,
    "start_time" TIMESTAMPTZ(6),
    "end_time" TIMESTAMPTZ(6),
    "customer_id" UUID,
    "assigned_to" UUID,
    "created_by" UUID,
    "address" TEXT,
    "status" TEXT DEFAULT 'scheduled',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sale_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "action_label" TEXT,
    "action_url" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "sent_email" BOOLEAN NOT NULL DEFAULT false,
    "sent_sms" BOOLEAN NOT NULL DEFAULT false,
    "sent_push" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'client',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operating_expenses_organization_id_date_idx" ON "operating_expenses"("organization_id", "date");

-- CreateIndex
CREATE INDEX "inventory_items_organization_id_sku_idx" ON "inventory_items"("organization_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_slug_key" ON "permissions"("slug");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permission_slug_key" ON "role_permissions"("role", "permission_slug");

-- CreateIndex
CREATE INDEX "accounting_accounts_organization_id_type_idx" ON "accounting_accounts"("organization_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_accounts_organization_id_code_key" ON "accounting_accounts"("organization_id", "code");

-- CreateIndex
CREATE INDEX "accounting_journals_organization_id_date_idx" ON "accounting_journals"("organization_id", "date");

-- CreateIndex
CREATE INDEX "accounting_journals_organization_id_status_idx" ON "accounting_journals"("organization_id", "status");

-- CreateIndex
CREATE INDEX "accounting_transactions_journal_id_idx" ON "accounting_transactions"("journal_id");

-- CreateIndex
CREATE INDEX "accounting_transactions_account_id_idx" ON "accounting_transactions"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "gmail_tokens_user_id_key" ON "gmail_tokens"("user_id");

-- CreateIndex
CREATE INDEX "project_phase_history_project_id_created_at_idx" ON "project_phase_history"("project_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "project_transactions_transaction_ref_key" ON "project_transactions"("transaction_ref");

-- CreateIndex
CREATE INDEX "project_transactions_project_id_created_at_idx" ON "project_transactions"("project_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "project_documents_project_id_type_idx" ON "project_documents"("project_id", "type");

-- CreateIndex
CREATE INDEX "project_documents_project_id_status_idx" ON "project_documents"("project_id", "status");

-- CreateIndex
CREATE INDEX "sales_organization_id_sale_number_idx" ON "sales"("organization_id", "sale_number");

-- CreateIndex
CREATE INDEX "appointments_organization_id_start_time_idx" ON "appointments"("organization_id", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_organization_id_status_idx" ON "invitations"("organization_id", "status");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "customers_organization_id_name_idx" ON "customers"("organization_id", "name");

-- CreateIndex
CREATE INDEX "customers_organization_id_email_idx" ON "customers"("organization_id", "email");

-- CreateIndex
CREATE INDEX "customers_organization_id_nif_idx" ON "customers"("organization_id", "nif");

-- CreateIndex
CREATE INDEX "invoices_organization_id_due_date_idx" ON "invoices"("organization_id", "due_date");

-- CreateIndex
CREATE INDEX "projects_client_id_client_portal_enabled_idx" ON "projects"("client_id", "client_portal_enabled");

-- CreateIndex
CREATE INDEX "projects_organization_id_created_at_idx" ON "projects"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_assigned_technician_id_fkey" FOREIGN KEY ("assigned_technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operating_expenses" ADD CONSTRAINT "operating_expenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_slug_fkey" FOREIGN KEY ("permission_slug") REFERENCES "permissions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_accounts" ADD CONSTRAINT "accounting_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_accounts" ADD CONSTRAINT "accounting_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_journals" ADD CONSTRAINT "accounting_journals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_journals" ADD CONSTRAINT "accounting_journals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_transactions" ADD CONSTRAINT "accounting_transactions_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "accounting_journals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_transactions" ADD CONSTRAINT "accounting_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounting_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_tokens" ADD CONSTRAINT "gmail_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_phase_history" ADD CONSTRAINT "project_phase_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_phase_history" ADD CONSTRAINT "project_phase_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_transactions" ADD CONSTRAINT "project_transactions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_transactions" ADD CONSTRAINT "project_transactions_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
