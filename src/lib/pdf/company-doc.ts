import prisma from '@/lib/prisma';
import type { DocCompany } from '@/lib/pdf/quotation-document-html';

const DEFAULT: DocCompany = {
	nameTh: 'บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด',
	nameEn: 'NPK SERVICE & SUPPLY CO.,LTD.',
	addressTh: '210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000',
	addressEn: '210/19 Moo.4 , Tombon Sanamchai , Amphur Mueang Suphanburi, Suphanburi 72000',
	taxId: '0105555161084',
	phones: ['09-8942-9891', '06-5961-9799', '09-3694-4591'],
	email: 'npkservicesupply@gmail.com'
};

/** ข้อมูลบริษัท + บัญชีธนาคาร จากหน้าตั้งค่าบริษัท (ถ้ายังไม่ได้ตั้งค่า ใช้ค่าเริ่มต้นของ NPK) */
export async function loadCompanyDoc(): Promise<{ company: DocCompany; bankLines: string[] }> {
	const c = await prisma.company.findFirst({ include: { bankAccounts: { orderBy: { createdAt: 'asc' } } } });

	if (!c) return { company: DEFAULT, bankLines: [] };

	return {
		company: {
			nameTh: c.nameTh || DEFAULT.nameTh,
			nameEn: c.nameEn || DEFAULT.nameEn,
			addressTh: c.addressTh || DEFAULT.addressTh,
			addressEn: c.addressEn || '',
			taxId: c.taxId || DEFAULT.taxId,
			phones: c.phones?.length ? c.phones : DEFAULT.phones,
			email: c.email || DEFAULT.email
		},
		bankLines: c.bankAccounts.map(
			(b) => `${b.bank} ชื่อบัญชี ${b.accountName} หมายเลขบัญชี ${b.accountNumber} สาขา${b.branch}`
		)
	};
}
