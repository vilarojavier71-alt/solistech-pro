/*
  Warnings:

  - You are about to drop the column `category` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `min_quantity` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `unit_price` on the `inventory_items` table. All the data in the column will be lost.
  - Added the required column `manufacturer` to the `inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `inventory_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "inventory_items_organization_id_sku_idx";

-- AlterTable
ALTER TABLE "inventory_items" DROP COLUMN "category",
DROP COLUMN "min_quantity",
DROP COLUMN "name",
DROP COLUMN "notes",
DROP COLUMN "quantity",
DROP COLUMN "unit_price",
ADD COLUMN     "cost_price" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "manufacturer" TEXT NOT NULL,
ADD COLUMN     "min_stock_alert" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "sale_price" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "stock_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "supplier_id" UUID,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'panel';

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "tax_id" TEXT,
    "address" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_organization_id_idx" ON "suppliers"("organization_id");

-- CreateIndex
CREATE INDEX "stock_movements_organization_id_item_id_idx" ON "stock_movements"("organization_id", "item_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at" DESC);

-- CreateIndex
CREATE INDEX "inventory_items_organization_id_type_idx" ON "inventory_items"("organization_id", "type");

-- CreateIndex
CREATE INDEX "inventory_items_manufacturer_model_idx" ON "inventory_items"("manufacturer", "model");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
