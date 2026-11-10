import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { recalcPOTotals } from '@/lib/po-totals';
import { computePOTotals, validateInstallments } from '@/components/purchase-orders/po-math';

const COST_TYPES = ['LABOUR', 'MATERIAL', 'OTHER'];

// GET /api/purchase-orders — List all purchase orders
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status');
		const search = searchParams.get('search');

		const where: Record<string, unknown> = {};

		if (status && status !== 'ALL') {
			where.status = status;
		}

		if (search) {
			where.OR = [
				{ poNumber: { contains: search, mode: 'insensitive' } },
				{ team: { teamName: { contains: search, mode: 'insensitive' } } },
				{ team: { leaderName: { contains: search, mode: 'insensitive' } } },
				{ workOrder: { woNumber: { contains: search, mode: 'insensitive' } } },
				{ quotation: { quotationNumber: { contains: search, mode: 'insensitive' } } },
				{ quotation: { projectName: { contains: search, mode: 'insensitive' } } }
			];
		}

		const purchaseOrders = await prisma.purchaseOrder.findMany({
			where,
			include: {
				workOrder: {
					select: {
						woNumber: true,
						poNumber: true,
						poDate: true,
						date: true,
						description: true,
						quotation: {
							select: {
								quotationNumber: true,
								projectName: true,
								date: true,
								totalAmount: true,
								customerGroup: { select: { groupName: true } },
								branch: { select: { name: true, code: true } }
							}
						}
					}
				},
				quotation: {
					select: {
						quotationNumber: true,
						projectName: true,
						date: true,
						subtotal: true,
						totalAmount: true,
						customerGroup: { select: { groupName: true } },
						branch: { select: { name: true, code: true } }
					}
				},
				team: { select: { teamName: true, leaderName: true, leaderPhone: true, leaderAddress: true } },
				adjustments: { orderBy: { createdAt: 'asc' } },
				installments: { select: { amount: true, paymentVouchers: { select: { amount: true } } } },
				items: {
					select: { totalMaterial: true, totalLabour: true, isAdjustment: true, quantity: true, amount: true }
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		return NextResponse.json(purchaseOrders);
	} catch (error) {
		console.error('GET /api/purchase-orders error:', error);
		return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
	}
}

// POST /api/purchase-orders — Create a new purchase order
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Generate PO number: PO{YYMMDD}/Npk-{XXX}
		const now = new Date();
		const yy = String(now.getFullYear()).slice(-2); // CE last 2 digits
		const mm = String(now.getMonth() + 1).padStart(2, '0');
		const dd = String(now.getDate()).padStart(2, '0');
		const datePrefix = `PO${yy}${mm}${dd}`;

		// Find last PO with same date prefix
		const lastPO = await prisma.purchaseOrder.findFirst({
			where: { poNumber: { startsWith: datePrefix } },
			orderBy: { poNumber: 'desc' }
		});

		let seq = 1;

		if (lastPO) {
			// Extract sequence from "PO260319/Npk-001" -> "001"
			const match = lastPO.poNumber.match(/Npk-(\d+)$/);

			if (match) {
				seq = parseInt(match[1], 10) + 1;
			}
		}

		const poNumber = `${datePrefix}/Npk-${String(seq).padStart(3, '0')}`;

		const purchaseOrder = await prisma.purchaseOrder.create({
			data: {
				poNumber,
				workOrderId: body.workOrderId || null,
				quotationId: body.quotationId || null,
				teamId: body.teamId || null,
				date: new Date(body.date || now),
				startDate: body.startDate ? new Date(body.startDate) : null,
				endDate: body.endDate ? new Date(body.endDate) : null,
				warrantyStartDate: body.warrantyStartDate ? new Date(body.warrantyStartDate) : null,
				warrantyEndDate: body.warrantyEndDate ? new Date(body.warrantyEndDate) : null,
				contractorQuoteUrl: body.contractorQuoteUrl || null,
				costType: COST_TYPES.includes(body.costType) ? body.costType : 'LABOUR',
				costCategory: body.costCategory || null,
				payeeName: body.payeeName || null,
				warrantyMonths: body.warrantyMonths ? Number(body.warrantyMonths) : null,
				whtPercent: Number(body.whtPercent) || 0,
				discountPercent: body.discountPercent || 0,
				vatPercent: body.vatPercent ?? 0,
				subtotal: body.subtotal || body.totalAmount || 0,
				totalAmount: body.totalAmount || 0,
				status: body.status || 'DRAFT',
				notes: body.notes || null,
				conditions: body.conditions || null,
				// Create adjustments if provided (legacy)
				adjustments:
					body.adjustments?.length > 0
						? {
								createMany: {
									data: body.adjustments.map(
										(adj: {
											adjustmentType: string;
											description: string;
											amount: number;
											createdBy?: string;
										}) => ({
											adjustmentType: adj.adjustmentType,
											description: adj.description,
											amount: adj.amount,
											createdBy: adj.createdBy || null
										})
									)
								}
							}
						: undefined
			},
			include: {
				workOrder: true,
				quotation: true,
				team: true,
				items: true,
				adjustments: true
			}
		});

		// ถ้ามีใบเสนอราคาแต่ไม่ส่งรายการมา → คัดลอกรายการ+ราคาจากใบเสนอราคาอัตโนมัติ
		if ((!body.items || body.items.length === 0) && body.quotationId) {
			const quotation = await prisma.quotation.findUnique({
				where: { id: body.quotationId },
				include: { items: { orderBy: { itemOrder: 'asc' } } }
			});

			if (quotation?.items.length) {
				body.items = quotation.items.map((qi, idx) => ({
					itemOrder: qi.itemOrder ?? idx,
					itemType: qi.itemType,
					parentIndex: qi.parentIndex,
					description: qi.description,
					unit: qi.unit,
					quantity: Number(qi.quantity) || 0,
					materialPrice: Number(qi.materialPrice) || 0,
					labourPrice: Number(qi.labourPrice) || 0
				}));

				if (body.discountPercent == null) body.discountPercent = Number(quotation.discountPercent) || 0;

				if (body.vatPercent == null) body.vatPercent = Number(quotation.vatPercent) || 0;

				await prisma.purchaseOrder.update({
					where: { id: purchaseOrder.id },
					data: {
						discountPercent: body.discountPercent,
						vatPercent: body.vatPercent
					}
				});
			}
		}

		// Create PurchaseOrderItem rows if items provided
		if (body.items?.length > 0) {
			const itemRows = body.items.map(
				(
					it: {
						itemType?: string;
						itemOrder?: number;
						parentIndex?: number | null;
						description: string;
						unit?: string;
						quantity?: number;
						materialPrice?: number;
						labourPrice?: number;
					},
					idx: number
				) => {
					const isHeader = (it.itemType || 'ITEM') === 'HEADER';
					const qty = isHeader ? 0 : Number(it.quantity || 1);
					const matP = isHeader ? 0 : Number(it.materialPrice || 0);
					const labP = isHeader ? 0 : Number(it.labourPrice || 0);
					const totalMat = qty * matP;
					const totalLab = qty * labP;
					const amount = totalMat + totalLab;
					return {
						purchaseOrderId: purchaseOrder.id,
						itemOrder: it.itemOrder ?? idx,
						itemType: it.itemType || 'ITEM',
						parentIndex: it.parentIndex ?? null,
						description: it.description || '',
						unit: it.unit || '',
						quantity: qty,
						materialPrice: matP,
						labourPrice: labP,
						totalMaterial: totalMat,
						totalLabour: totalLab,
						amount,
						isLocked: false,
						isAdjustment: false
					};
				}
			);
			await prisma.purchaseOrderItem.createMany({ data: itemRows });
		}

		// คำนวณยอดรวม/ส่วนลด/VAT/หัก ณ ที่จ่าย ตามรายการ (ถ้าไม่มีรายการ ใช้ยอดที่ส่งมา)
		if (body.items?.length > 0) {
			await recalcPOTotals(purchaseOrder.id);
		} else if (body.totalAmount || body.subtotal) {
			await prisma.purchaseOrder.update({
				where: { id: purchaseOrder.id },
				data: computePOTotals(
					Number(body.subtotal || body.totalAmount),
					Number(body.discountPercent) || 0,
					Number(body.vatPercent) || 0,
					Number(body.whtPercent) || 0
				)
			});
		}

		// งวดจ่าย (ไม่จำกัดจำนวน)
		if (Array.isArray(body.installments) && body.installments.length > 0) {
			const fresh = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrder.id } });
			const total = Number(fresh?.totalAmount) || 0;
			const v = validateInstallments(total, body.installments);

			if (!v.ok) {
				await prisma.purchaseOrder.delete({ where: { id: purchaseOrder.id } });
				return NextResponse.json({ error: 'ยอดรวมทุกงวดเกินยอดสุทธิของใบสั่งซื้อ' }, { status: 400 });
			}

			await prisma.pOInstallment.createMany({
				data: body.installments.map(
					(
						it: { percent?: number; dueDate?: string; retentionAmount?: number; notes?: string },
						i: number
					) => ({
						purchaseOrderId: purchaseOrder.id,
						seq: i + 1,
						percent: it.percent ? Number(it.percent) : null,
						dueDate: it.dueDate ? new Date(it.dueDate) : null,
						amount: v.amounts[i],
						retentionAmount: Number(it.retentionAmount) || 0,
						notes: it.notes || null
					})
				)
			});
		}

		return NextResponse.json(purchaseOrder, { status: 201 });
	} catch (error) {
		console.error('POST /api/purchase-orders error:', error);
		return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
	}
}
