'use client';

import { ArrowLeft, Download, Printer, Save, Send, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAlert } from '@/components/shared/AlertProvider';
import {
	DateInput,
	Button,
	Card,
	CardHeader,
	ComboInput,
	Field,
	IconButton,
	Input,
	PageHeader,
	PrintPreviewDialog,
	RecordDialog,
	Select,
	StatusBadge,
	Textarea,
	type RecordField
} from '@/components/ui';
import { bahtText } from '@/lib/baht-text';
import { formatDateLong, formatMoney } from '@/lib/format';
import { downloadQuotationPdf } from '@/lib/pdf/download-quotation';
import {
	appendOverheadItem,
	computeQuotationTotals,
	findParentHeaderIndex,
	hasOverheadInItems,
	isOverheadItem,
	OVERHEAD_ITEM_TYPE
} from '@/lib/quotation-line-items';
import { useQuotationStatuses } from '@/lib/use-quotation-statuses';
import { sendJson, useApi } from '@/lib/use-api';
import { LineItemsEditor, initialLines, type Line } from './LineItemsEditor';
import { QuotationPhotos } from './QuotationPhotos';

type Branch = {
	id: string;
	code: string;
	name: string;
	contactName?: string | null;
	contactPhone?: string | null;
	address?: string | null;
};
type Contact = { id: string; name: string; phone?: string | null };
type Customer = {
	id: string;
	groupName: string;
	headOfficeAddress?: string | null;
	contactName?: string | null;
	contactPhone?: string | null;
	taxId?: string | null;
	branches: Branch[];
	contacts?: Contact[];
};

const CUSTOMER_FIELDS: RecordField[] = [
	{ key: 'groupName', label: 'ชื่อลูกค้า', required: true, span: 2 },
	{ key: 'taxId', label: 'เลขประจำตัวผู้เสียภาษี' },
	{ key: 'contactName', label: 'ผู้ติดต่อ' },
	{ key: 'contactPhone', label: 'เบอร์โทร' },
	{ key: 'contactEmail', label: 'อีเมล', type: 'email' },
	{ key: 'headOfficeAddress', label: 'ที่อยู่', required: true, multiline: true }
];
const BRANCH_FIELDS: RecordField[] = [
	{ key: 'code', label: 'รหัสสาขา', required: true },
	{ key: 'name', label: 'ชื่อสาขา' },
	{ key: 'contactName', label: 'ผู้ติดต่อ' },
	{ key: 'contactPhone', label: 'เบอร์โทร' },
	{ key: 'address', label: 'ที่อยู่', multiline: true }
];
const CONTACT_FIELDS: RecordField[] = [
	{ key: 'name', label: 'ชื่อผู้ติดต่อ', required: true },
	{ key: 'position', label: 'ตำแหน่ง' },
	{ key: 'phone', label: 'เบอร์โทร' },
	{ key: 'email', label: 'อีเมล', type: 'email' }
];

const today = () => new Date().toISOString().split('T')[0];

type ApiItem = {
	itemType?: string;
	description: string;
	unit?: string;
	quantity: number;
	unitPrice?: number;
	materialPrice?: number;
	labourPrice?: number;
	isAdjustment?: boolean;
};
type ApiQuotation = {
	id?: string;
	quotationNumber: string;
	revisionNumber?: number;
	status: string;
	customerGroupId?: string;
	branchId?: string;
	contactPerson?: string;
	contactPhone?: string;
	address?: string;
	customerGroup?: { headOfficeAddress?: string };
	projectName?: string;
	date: string;
	validDays?: number;
	vatPercent?: number;
	discountAmount?: number;
	conditions?: string;
	warranty?: string;
	notes?: string;
	items?: ApiItem[];
};

type Props = { id?: string };

/** ฟอร์มใบเสนอราคา: ใช้ร่วมกันทั้งหน้าสร้างใหม่ (ไม่มี id) และหน้าแก้ไข */
export function QuotationForm({ id }: Props) {
	const router = useRouter();
	const qs = useQuotationStatuses();
	const alert = useAlert();
	const qc = useQueryClient();
	const isEdit = !!id;
	const { data: customersData } = useApi<Customer[]>('/api/customers');
	const customers = useMemo(() => (Array.isArray(customersData) ? customersData : []), [customersData]);
	const {
		data: loaded,
		isLoading,
		isError
	} = useApi<ApiQuotation | null>(`/api/quotations/${id}`, undefined, isEdit, { refetchOnWindowFocus: false });

	const [number, setNumber] = useState('');
	const [revision, setRevision] = useState(0);
	const [status, setStatus] = useState('DRAFT');
	const [customerGroupId, setCustomerGroupId] = useState('');
	const [branchId, setBranchId] = useState('');
	const [contactPerson, setContactPerson] = useState('');
	const [contactPhone, setContactPhone] = useState('');
	const [address, setAddress] = useState('');
	const [projectName, setProjectName] = useState('');
	const [date, setDate] = useState(today());
	const [validDays, setValidDays] = useState(30);
	const [vatPercent, setVatPercent] = useState(7);
	const [discount, setDiscount] = useState(0);
	const [conditions, setConditions] = useState('');
	const [notes, setNotes] = useState('');
	const [overhead, setOverhead] = useState(false);
	const [items, setItems] = useState<Line[]>(initialLines());
	const [errors, setErrors] = useState<{ customer?: string; items?: string }>({});
	const [saving, setSaving] = useState(false);
	const [pdfOpen, setPdfOpen] = useState(false);
	const [dlg, setDlg] = useState<'customer' | 'branch' | 'contact' | null>(null);

	useEffect(() => {
		const q = loaded;

		if (!q || !q.id) return;

		setNumber(q.quotationNumber);
		setRevision(q.revisionNumber || 0);
		setStatus(q.status);
		setCustomerGroupId(q.customerGroupId || '');
		setBranchId(q.branchId || '');
		setContactPerson(q.contactPerson || '');
		setContactPhone(q.contactPhone || '');
		setAddress(q.address || q.customerGroup?.headOfficeAddress || '');
		setProjectName(q.projectName || '');
		setDate(new Date(q.date).toISOString().split('T')[0]);
		setValidDays(q.validDays || 30);
		setVatPercent(Number(q.vatPercent) || 7);
		setDiscount(Number(q.discountAmount) || 0);
		setConditions(q.conditions || q.warranty || '');
		setNotes(q.notes || '');

		const rows: Line[] = (q.items || []).map((it, i) => ({
			tempId: i + 1,
			itemType: (it.itemType || 'ITEM') as Line['itemType'],
			description: it.description,
			unit: it.unit || '',
			quantity: Number(it.quantity),
			materialPrice: Number(it.materialPrice || it.unitPrice || 0),
			labourPrice: Number(it.labourPrice || 0),
			isAdjustment: Boolean(it.isAdjustment)
		}));

		if (rows.length) {
			setOverhead(hasOverheadInItems(rows));
			setItems(rows.filter((r) => !isOverheadItem(r)));
		}
	}, [loaded]);

	const customer = customers.find((c) => c.id === customerGroupId);
	const effective = useMemo(() => appendOverheadItem(items, overhead), [items, overhead]);
	const totals = useMemo(
		() => computeQuotationTotals(effective, discount, vatPercent),
		[effective, discount, vatPercent]
	);
	const readOnly = status === 'CANCELLED';
	const displayNumber = revision > 0 ? `${number} Rev. ${revision}` : number;
	const meta = qs.meta(status);

	function pickCustomer(cid: string) {
		const c = customers.find((x) => x.id === cid);
		setCustomerGroupId(cid);
		setBranchId('');
		setContactPerson(c?.contactName || '');
		setContactPhone(c?.contactPhone || '');
		setAddress(c?.headOfficeAddress || '');
		setErrors((e) => ({ ...e, customer: undefined }));
	}

	// เลือกสาขา: ใช้ผู้ติดต่อ/เบอร์ของสาขาถ้ามี ไม่มีก็ย้อนกลับไปใช้ของลูกค้า (ลำดับ: ผู้ติดต่อที่เลือก > สาขา > ลูกค้า)
	function pickBranch(bid: string) {
		setBranchId(bid);

		const b = customer?.branches?.find((x) => x.id === bid);
		setContactPerson(b?.contactName || customer?.contactName || '');
		setContactPhone(b?.contactPhone || customer?.contactPhone || '');
		// ที่อยู่: ค่าเริ่มต้นเป็นสำนักงานใหญ่ เลือกสาขาแล้วใช้ที่อยู่สาขา (แก้เองได้)
		setAddress(b?.address || customer?.headOfficeAddress || '');
	}

	function onDiscount(v: number) {
		setDiscount(v);

		if (v > 0) setDate(today()); // ตรรกะเดิม: ใส่ส่วนลดแล้วใช้วันที่ปัจจุบัน
	}

	async function save(target?: 'DRAFT' | 'SENT') {
		const errs: typeof errors = {};

		if (!customerGroupId) errs.customer = 'กรุณาเลือกลูกค้า';

		if (items.filter((i) => i.itemType === 'ITEM').some((i) => !i.description.trim()))
			errs.items = 'กรุณากรอกรายละเอียดรายการให้ครบ';

		setErrors(errs);

		if (Object.keys(errs).length) return;

		setSaving(true);

		try {
			const processed = effective.map((it, idx) => {
				if (isOverheadItem(it))
					return {
						itemType: OVERHEAD_ITEM_TYPE,
						description: it.description,
						unit: it.unit,
						quantity: Number(it.quantity),
						materialPrice: Number(it.materialPrice),
						labourPrice: Number(it.labourPrice)
					};

				if (it.itemType === 'HEADER')
					return {
						itemType: 'HEADER',
						description: it.description,
						unit: it.unit || '',
						quantity: Number(it.quantity) || 0,
						materialPrice: Number(it.materialPrice) || 0,
						labourPrice: Number(it.labourPrice) || 0
					};

				const p = findParentHeaderIndex(effective, idx);

				return {
					itemType: 'ITEM',
					parentIndex: p >= 0 ? p : undefined,
					description: it.description,
					unit: it.unit,
					quantity: Number(it.quantity),
					materialPrice: Number(it.materialPrice),
					labourPrice: Number(it.labourPrice),
					isAdjustment: Boolean((it as Line).isAdjustment)
				};
			});
			const body = {
				customerGroupId,
				branchId: branchId || null,
				contactPerson,
				contactPhone,
				address: address || null,
				projectName,
				date,
				validDays,
				vatPercent,
				discountAmount: discount,
				conditions,
				notes,
				items: processed
			};

			if (isEdit) await sendJson(`/api/quotations/${id}`, 'PATCH', { ...body, status: target || status });
			else
				await sendJson('/api/quotations', 'POST', {
					...body,
					status: target ?? 'DRAFT',
					createdById: 'system'
				});

			await qc.invalidateQueries({ queryKey: ['/api/quotations'] });
			alert.showSuccess(
				isEdit ? 'บันทึกเรียบร้อย' : 'สร้างเรียบร้อย',
				isEdit ? `ใบเสนอราคา ${number} ถูกบันทึกแล้ว` : 'ใบเสนอราคาถูกสร้างแล้ว'
			);
			setTimeout(() => router.push('/apps/quotations'), 1200);
		} catch (e) {
			const m = e instanceof Error ? e.message : '';
			alert.showError(
				'เกิดข้อผิดพลาด',
				m && m.length < 200 && !/prisma|TURBOPACK|\.next\//.test(m) ? m : 'ไม่สามารถบันทึกได้ กรุณาลองใหม่'
			);
		} finally {
			setSaving(false);
		}
	}

	async function createRelated(kind: 'customer' | 'branch' | 'contact', v: Record<string, string>) {
		try {
			const created = await sendJson(
				kind === 'customer' ? '/api/customers' : kind === 'branch' ? '/api/branches' : '/api/contacts',
				'POST',
				kind === 'customer' ? v : { ...v, customerGroupId }
			);
			await qc.invalidateQueries({ queryKey: ['/api/customers'] });

			if (kind === 'customer') {
				setCustomerGroupId(created.id);
				setBranchId('');
				setContactPerson(created.contactName || '');
				setContactPhone(created.contactPhone || '');
				setAddress(created.headOfficeAddress || '');
			} else if (kind === 'branch') setBranchId(created.id);
			else {
				setContactPerson(created.name);
				setContactPhone(created.phone || '');
			}

			alert.showSuccess('เพิ่มสำเร็จ');
			setDlg(null);
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
		}
	}

	if (isEdit && isLoading) return <p className="text-ink-muted py-20 text-center">กำลังโหลด...</p>;

	if (isEdit && (isError || !loaded?.id))
		return (
			<p
				role="alert"
				className="text-danger py-20 text-center"
			>
				ไม่พบใบเสนอราคานี้
			</p>
		);

	return (
		<>
			<PageHeader
				title={
					<span className="inline-flex items-center gap-2">
						<IconButton
							aria-label="ย้อนกลับ"
							onClick={() => router.back()}
						>
							<ArrowLeft size={22} />
						</IconButton>
						{isEdit ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคา'}
					</span>
				}
				badge={
					isEdit ? (
						<StatusBadge
							label={meta.label}
							tone={meta.tone}
							color={meta.color}
							bgColor={meta.bgColor}
						/>
					) : (
						<StatusBadge
							label="ใหม่"
							tone="tint"
						/>
					)
				}
				subtitle={isEdit ? `เลขที่ ${displayNumber}` : 'เลขที่จะถูกสร้างอัตโนมัติเมื่อบันทึก'}
				actions={
					readOnly ? null : (
						<>
							<Button
								variant="ghost"
								onClick={() => router.push('/apps/quotations')}
							>
								ยกเลิก
							</Button>
							{isEdit && (
								<Button
									variant="outline"
									icon={<Printer size={18} />}
									onClick={() => setPdfOpen(true)}
								>
									ดูตัวอย่าง PDF
								</Button>
							)}
							{isEdit && status !== 'DRAFT' && status !== 'SENT' ? (
								<Button
									icon={<Save size={18} />}
									disabled={saving}
									onClick={() => save()}
								>
									บันทึก
								</Button>
							) : (
								<>
									<Button
										variant="soft"
										icon={<Save size={18} />}
										disabled={saving}
										onClick={() => save('DRAFT')}
									>
										บันทึกร่าง
									</Button>
									<Button
										icon={<Send size={18} />}
										disabled={saving}
										onClick={() => save('SENT')}
									>
										บันทึกและส่งลูกค้า
									</Button>
								</>
							)}
						</>
					)
				}
			/>
			{readOnly && (
				<p
					role="alert"
					className="bg-warn-soft text-warn rounded-xl px-4 py-3"
				>
					ใบเสนอราคานี้ถูกยกเลิกแล้ว ไม่สามารถแก้ไขได้
				</p>
			)}

			<div className="flex flex-col gap-6">
				<Card>
					<CardHeader title="ข้อมูลลูกค้าและเอกสาร" />
					<div className="grid grid-cols-1 gap-x-5 gap-y-4 min-[1280px]:grid-cols-4 md:grid-cols-2">
						<Field
							label="ลูกค้า"
							required
							error={errors.customer}
							className="min-[1280px]:col-span-2"
							action={
								!readOnly && (
									<button
										type="button"
										className="text-primary-ink inline-flex cursor-pointer items-center gap-1 text-[15px] font-medium hover:underline"
										onClick={() => setDlg('customer')}
									>
										<UserPlus
											size={16}
											aria-hidden="true"
										/>
										เพิ่มลูกค้าใหม่
									</button>
								)
							}
						>
							{(fid, bad) => (
								<Select
									id={fid}
									aria-invalid={bad}
									disabled={readOnly}
									value={customerGroupId}
									onChange={(e) => pickCustomer(e.target.value)}
								>
									<option value="">เลือกกลุ่มลูกค้า</option>
									{customers.map((c) => (
										<option
											key={c.id}
											value={c.id}
										>
											{c.groupName}
										</option>
									))}
								</Select>
							)}
						</Field>
						<Field
							label="สาขา"
							action={
								!readOnly && (
									<button
										type="button"
										disabled={!customer}
										className="text-primary-ink inline-flex cursor-pointer items-center gap-1 text-[15px] font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-40"
										onClick={() => setDlg('branch')}
									>
										+ เพิ่มสาขา
									</button>
								)
							}
						>
							{(fid) => (
								<Select
									id={fid}
									disabled={readOnly || !customer}
									value={branchId}
									onChange={(e) => pickBranch(e.target.value)}
								>
									<option value="">ไม่ระบุสาขา</option>
									{(customer?.branches ?? []).map((b) => (
										<option
											key={b.id}
											value={b.id}
										>
											{b.code}: {b.name}
										</option>
									))}
								</Select>
							)}
						</Field>
						<Field
							label="ผู้ติดต่อ"
							action={
								!readOnly && (
									<button
										type="button"
										disabled={!customer}
										className="text-primary-ink inline-flex cursor-pointer items-center gap-1 text-[15px] font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-40"
										onClick={() => setDlg('contact')}
									>
										+ เพิ่มผู้ติดต่อ
									</button>
								)
							}
						>
							{(fid) => (
								<>
									<ComboInput
										id={fid}
										options={(customer?.contacts ?? []).map((c) => c.name)}
										value={contactPerson}
										disabled={readOnly}
										placeholder="ชื่อผู้ติดต่อ"
										onChange={(v) => {
											setContactPerson(v);
											const c = customer?.contacts?.find((x) => x.name === v);

											if (c) setContactPhone(c.phone || '');
										}}
									/>
								</>
							)}
						</Field>

						<Field label="เบอร์โทร">
							{(fid) => (
								<Input
									id={fid}
									value={contactPhone}
									disabled={readOnly}
									onChange={(e) => setContactPhone(e.target.value)}
								/>
							)}
						</Field>
						<Field label="เลขประจำตัวผู้เสียภาษี">
							{(fid) => (
								<Input
									id={fid}
									value={customer?.taxId || '-'}
									readOnly
									className="bg-surface-2"
								/>
							)}
						</Field>
						<Field
							label="วันที่"
							hint={formatDateLong(date)}
						>
							{(fid) => (
								<DateInput
									id={fid}
									value={date}
									disabled={readOnly}
									onChange={(e) => setDate(e.target.value)}
								/>
							)}
						</Field>
						<Field label="ยืนราคา (วัน)">
							{(fid) => (
								<Input
									id={fid}
									type="number"
									min={1}
									value={validDays}
									disabled={readOnly}
									onChange={(e) => setValidDays(Number(e.target.value))}
								/>
							)}
						</Field>

						<Field
							label="ที่อยู่"
							className="md:col-span-2"
						>
							{(fid) => (
								<Textarea
									id={fid}
									rows={3}
									value={address}
									disabled={readOnly}
									onChange={(e) => setAddress(e.target.value)}
								/>
							)}
						</Field>
						<Field
							label="ชื่อโครงการ / งาน"
							className="md:col-span-2"
						>
							{(fid) => (
								<Textarea
									id={fid}
									rows={3}
									value={projectName}
									disabled={readOnly}
									onChange={(e) => setProjectName(e.target.value)}
								/>
							)}
						</Field>
					</div>
				</Card>

				<Card>
					<CardHeader title="รายการสินค้า/บริการ" />
					<LineItemsEditor
						items={items}
						onChange={setItems}
						includeOverhead={overhead}
						onOverheadChange={setOverhead}
						readOnly={readOnly}
						error={errors.items}
					/>
				</Card>

				<div className="grid grid-cols-1 items-start gap-6 min-[1000px]:grid-cols-2">
					<Card>
						<CardHeader title="สรุปยอด" />
						<dl className="flex flex-col gap-3 text-[15px]">
							<div className="flex justify-between">
								<dt className="text-ink-muted">รวมเป็นเงิน</dt>
								<dd className="font-semibold tabular-nums">{formatMoney(totals.subtotal)}</dd>
							</div>
							<div className="flex items-center justify-between gap-3">
								<dt className="text-ink-muted">
									<label htmlFor="q-discount">ส่วนลด</label>
								</dt>
								<dd>
									<Input
										id="q-discount"
										type="number"
										min={0}
										value={discount}
										disabled={readOnly}
										className="w-36 text-right"
										onFocus={(e) => e.target.select()}
										onChange={(e) => onDiscount(Number(e.target.value))}
									/>
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="font-display text-[18px] font-semibold">ยอดหลังหักส่วนลด</dt>
								<dd className="font-display text-[20px] font-semibold tabular-nums">
									{formatMoney(totals.afterDiscount)}
								</dd>
							</div>
							<div className="flex items-center justify-between gap-3">
								<dt className="text-ink-muted flex items-center gap-2">
									<label htmlFor="q-vat">VAT</label>
									<Input
										id="q-vat"
										type="number"
										min={0}
										max={100}
										value={vatPercent}
										disabled={readOnly}
										className="w-20 text-right"
										onFocus={(e) => e.target.select()}
										onChange={(e) => setVatPercent(Number(e.target.value))}
									/>
									%
								</dt>
								<dd className="font-semibold tabular-nums">{formatMoney(totals.vatAmount)}</dd>
							</div>
							<div className="border-line border-t pt-3">
								<div className="flex items-baseline justify-between gap-3">
									<dt className="font-display text-[18px] font-semibold">ยอดรวมทั้งสิ้น</dt>
									<dd className="font-display text-primary-ink text-[20px] font-semibold tabular-nums">
										{formatMoney(totals.totalAmount)}
									</dd>
								</div>
								<p className="text-ink-muted mt-1 text-right text-[13px]">
									({bahtText(totals.totalAmount)})
								</p>
							</div>
						</dl>
					</Card>
					<Card>
						<CardHeader title="เงื่อนไขและหมายเหตุ" />
						<Field label="เงื่อนไข">
							{(fid) => (
								<Textarea
									id={fid}
									rows={5}
									value={conditions}
									disabled={readOnly}
									placeholder="เงื่อนไขการชำระเงิน การรับประกัน ระยะเวลาดำเนินการ"
									onChange={(e) => setConditions(e.target.value)}
								/>
							)}
						</Field>
						<Field label="หมายเหตุ">
							{(fid) => (
								<Textarea
									id={fid}
									rows={3}
									value={notes}
									disabled={readOnly}
									placeholder="หมายเหตุเพิ่มเติมที่แสดงในใบเสนอราคา"
									onChange={(e) => setNotes(e.target.value)}
								/>
							)}
						</Field>
					</Card>
				</div>

				{isEdit && <QuotationPhotos quotationId={id!} />}
			</div>

			<RecordDialog
				open={dlg === 'customer'}
				title="เพิ่มลูกค้าใหม่"
				fields={CUSTOMER_FIELDS}
				onSubmit={(v) => createRelated('customer', v)}
				onClose={() => setDlg(null)}
			/>
			<RecordDialog
				open={dlg === 'branch'}
				title="เพิ่มสาขา"
				fields={BRANCH_FIELDS}
				onSubmit={(v) => createRelated('branch', { ...v, name: v.name || v.code })}
				onClose={() => setDlg(null)}
			/>
			<RecordDialog
				open={dlg === 'contact'}
				title="เพิ่มผู้ติดต่อ"
				fields={CONTACT_FIELDS}
				onSubmit={(v) => createRelated('contact', v)}
				onClose={() => setDlg(null)}
			/>
			{isEdit && (
				<PrintPreviewDialog
					open={pdfOpen}
					onClose={() => setPdfOpen(false)}
					title={displayNumber}
					src={`/api/quotations/${id}/pdf`}
					extraActions={
						<Button
							variant="outline"
							icon={<Download size={18} />}
							onClick={() =>
								downloadQuotationPdf(id!).catch(() =>
									alert.showError('ดาวน์โหลดไม่สำเร็จ', 'ไม่สามารถสร้างไฟล์ PDF ได้')
								)
							}
						>
							ดาวน์โหลด
						</Button>
					}
				/>
			)}
		</>
	);
}
