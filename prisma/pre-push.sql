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
