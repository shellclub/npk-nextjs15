/**
 * ดาวน์โหลด PDF ใบเสนอราคา: เปิดแม่แบบพิมพ์เดียวกับหน้าตัวอย่าง (/api/quotations/{id}/pdf) แล้วเรียกหน้าต่างพิมพ์
 * ให้เลือก "บันทึกเป็น PDF" จึงได้เอกสารหน้าตาเหมือนกันทุกที่ (ใบเสนอราคา + รูปภาพ REPORT)
 */
export async function downloadQuotationPdf(id: string) {
	const w = window.open(`/api/quotations/${id}/pdf?print=1`, '_blank');

	if (!w) throw new Error('เบราว์เซอร์บล็อกหน้าต่างใหม่');
}
