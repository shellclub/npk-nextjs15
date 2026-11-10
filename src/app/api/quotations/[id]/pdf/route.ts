import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { thaiDate } from '@/lib/pdf/npk-document-html';
import { buildQuotationDocumentHtml } from '@/lib/pdf/quotation-document-html';
import { loadCompanyDoc } from '@/lib/pdf/company-doc';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const q = await prisma.quotation.findUnique({
			where: { id },
			include: {
				customerGroup: true,
				branch: true,
				createdBy: { select: { name: true } },
				items: { orderBy: { itemOrder: 'asc' } },
				photos: { orderBy: { createdAt: 'asc' } },
				workOrders: {
					select: { woNumber: true, poNumber: true, warrantyStartDate: true, warrantyEndDate: true },
					where: { status: { not: 'CANCELLED' } }
				}
			}
		});

		if (!q) {
			return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
		}

		const origin = request.nextUrl.origin;
		const { company, bankLines } = await loadCompanyDoc();

		const displayQN =
			(q.revisionNumber || 0) > 0 ? `${q.quotationNumber} Rev. ${q.revisionNumber}` : q.quotationNumber;

		const html = buildQuotationDocumentHtml({
			pageTitle: `ใบเสนอราคา ${displayQN}`,
			company,
			logoUrl: `${origin}/api/company/asset/logo`,
			signatureUrl: `${origin}/api/company/asset/signature`,
			stampUrl: `${origin}/api/company/asset/stamp`,
			customerName: q.customerGroup?.groupName || '-',
			branchDisplay: q.branch ? `${q.branch.code || ''} ${q.branch.name}`.trim() : '-',
			// ที่อยู่: ที่กรอกในใบนี้ > ที่อยู่สาขา > สำนักงานใหญ่ของลูกค้า
			address: q.address || q.branch?.address || q.customerGroup?.headOfficeAddress || '',
			validDays: q.validDays || 30,
			projectName: q.projectName || '',
			displayQN,
			dateText: thaiDate(new Date(q.date)),
			// ผู้ติดต่อ: ที่กรอกในใบนี้ > ผู้ติดต่อของสาขา > ผู้ติดต่อของลูกค้า
			contactPerson: q.contactPerson || q.branch?.contactName || q.customerGroup?.contactName || '',
			contactPhone: q.contactPhone || q.branch?.contactPhone || q.customerGroup?.contactPhone || '',
			items: q.items,
			conditions: q.conditions || q.warranty || '',
			notes: q.notes || '',
			bankLines,
			subtotal: Number(q.subtotal),
			discountAmount: Number(q.discountAmount),
			vatPercent: Number(q.vatPercent),
			vatAmount: Number(q.vatAmount),
			totalAmount: Number(q.totalAmount),
			signerName: q.createdBy?.name || 'มนต์เทียน เรืองเดชอังกูร',
			photos: q.photos
		});

		const autoPrint = request.nextUrl.searchParams.get('print') === '1';
		const body = autoPrint
			? html.replace(
					'</body>',
					'<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},800)})</script></body>'
				)
			: html;

		return new NextResponse(body, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	} catch (error) {
		console.error('PDF generation error:', error);
		return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
	}
}
