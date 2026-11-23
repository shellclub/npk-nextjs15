-- รันก่อน `prisma db push` ทุกครั้ง (idempotent)
-- แปลง Quotation.status จาก enum QuotationStatus เป็น text โดยเก็บค่าเดิมไว้
-- (ถ้าปล่อยให้ db push จัดการเอง มันจะ drop คอลัมน์แล้วสร้างใหม่ ทำให้สถานะเดิมหาย)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Quotation' AND column_name = 'status' AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE "Quotation" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "Quotation" ALTER COLUMN "status" TYPE text USING "status"::text;
    ALTER TABLE "Quotation" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
  END IF;
END $$;
DROP TYPE IF EXISTS "QuotationStatus";

-- WorkOrderStatusConfig: เพิ่ม appliesTo และเปลี่ยน unique(code) เป็น unique(code, appliesTo)
-- (แถวเดิมทั้งหมดเป็นของ WO จึงไม่ซ้ำกัน)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WorkOrderStatusConfig') THEN
    ALTER TABLE "WorkOrderStatusConfig" ADD COLUMN IF NOT EXISTS "appliesTo" text NOT NULL DEFAULT 'WO';
    DROP INDEX IF EXISTS "WorkOrderStatusConfig_code_key";
    CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrderStatusConfig_code_appliesTo_key"
      ON "WorkOrderStatusConfig" ("code", "appliesTo");
  END IF;
END $$;
