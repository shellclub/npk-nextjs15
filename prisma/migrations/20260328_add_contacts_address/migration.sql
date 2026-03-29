-- Migration: Add contacts table and address field to quotation
-- Created: 2026-03-28

-- CreateTable Contact (multiple contacts per customer group)
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "position" TEXT,
    "customerGroupId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- Add address field to Quotation (optional per-quotation address override)
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "address" TEXT;

-- Add foreign key for Contact -> CustomerGroup
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerGroupId_fkey" 
    FOREIGN KEY ("customerGroupId") REFERENCES "CustomerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for better performance
CREATE INDEX "Contact_customerGroupId_idx" ON "Contact"("customerGroupId");

-- Migrate existing contact data from CustomerGroup to Contact table
-- (creates a Contact entry for each CustomerGroup that has contactName)
INSERT INTO "Contact" ("id", "name", "phone", "customerGroupId")
SELECT 
    gen_random_uuid()::text,
    "contactName",
    "contactPhone",
    "id"
FROM "CustomerGroup"
WHERE "contactName" IS NOT NULL AND "contactName" != '';
