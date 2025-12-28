-- CreateTable
CREATE TABLE "municipal_benefits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "municipality" TEXT,
    "province" TEXT,
    "autonomous_community" TEXT NOT NULL,
    "scope_level" TEXT NOT NULL,
    "ibi_percentage" DECIMAL(5,2) NOT NULL,
    "ibi_years" INTEGER NOT NULL,
    "icio_percentage" DECIMAL(5,2) NOT NULL,
    "requirements" JSONB NOT NULL DEFAULT '[]',
    "source_url" TEXT,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "municipal_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "municipal_benefits_municipality_idx" ON "municipal_benefits"("municipality");

-- CreateIndex
CREATE INDEX "municipal_benefits_province_idx" ON "municipal_benefits"("province");

-- CreateIndex
CREATE INDEX "municipal_benefits_autonomous_community_idx" ON "municipal_benefits"("autonomous_community");
