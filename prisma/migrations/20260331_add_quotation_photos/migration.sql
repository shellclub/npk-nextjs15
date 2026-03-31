-- CreateTable
CREATE TABLE "QuotationPhoto" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "photoType" TEXT NOT NULL DEFAULT 'BEFORE',
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuotationPhoto_quotationId_idx" ON "QuotationPhoto"("quotationId");

-- AddForeignKey
ALTER TABLE "QuotationPhoto" ADD CONSTRAINT "QuotationPhoto_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
