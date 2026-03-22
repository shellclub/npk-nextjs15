-- Migration: Add quotation item types, conditions, and new fields
-- Description: Support for header/sub-item structure, Material/Labour pricing, 
--              conditions field, and revision numbering in quotations

-- Add new columns to Quotation table
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "revisionNumber" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "conditions" TEXT;

-- Add new columns to QuotationItem table
ALTER TABLE "QuotationItem" ADD COLUMN IF NOT EXISTS "itemType" TEXT NOT NULL DEFAULT 'ITEM';
ALTER TABLE "QuotationItem" ADD COLUMN IF NOT EXISTS "parentIndex" INTEGER;
ALTER TABLE "QuotationItem" ADD COLUMN IF NOT EXISTS "materialPrice" DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE "QuotationItem" ADD COLUMN IF NOT EXISTS "labourPrice" DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Add CANCELLED to QuotationStatus enum (if not already exists)
ALTER TYPE "QuotationStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Set defaults for existing QuotationItem rows (unit and quantity)
ALTER TABLE "QuotationItem" ALTER COLUMN "unit" SET DEFAULT '';
ALTER TABLE "QuotationItem" ALTER COLUMN "quantity" SET DEFAULT 0;
ALTER TABLE "QuotationItem" ALTER COLUMN "unitPrice" SET DEFAULT 0;
ALTER TABLE "QuotationItem" ALTER COLUMN "amount" SET DEFAULT 0;

-- For existing items, set materialPrice = unitPrice (since no split existed before)
UPDATE "QuotationItem" SET "materialPrice" = "unitPrice" WHERE "materialPrice" = 0 AND "unitPrice" > 0;
