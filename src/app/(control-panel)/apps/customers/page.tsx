'use client';

import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	Button,
	Card,
	CardHeader,
	ConfirmDialog,
	DataTable,
	FilterField,
	FilterTabs,
	IconButton,
	PageHeader,
	RecordDialog,
	SearchInput,
	StatusBadge,
	TwoLine,
	type RecordField
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { sendJson, useApi } from '@/lib/use-api';

type Branch = {
	id: string;
	code: string;
	name: string;
	address?: string | null;
	contactName?: string | null;
	contactPhone?: string | null;
};
type Contact = { id: string; name: string; phone?: string | null; email?: string | null; position?: string | null };
type Customer = {
	id: string;
	groupName: string;
	headOfficeAddress: string;
	taxId?: string | null;
	contactName?: string | null;
	contactPhone?: string | null;
	contactEmail?: string | null;
	isActive: boolean;
	branches: Branch[];
	contacts: Contact[];
};

type Tab = 'ALL' | 'ACTIVE' | 'INACTIVE';
type Dlg = {
	kind: 'customer' | 'branch' | 'contact';
	record?: Record<string, string | null | undefined> & { id?: string };
} | null;

const FIELDS: Record<'customer' | 'branch' | 'contact', RecordField[]> = {
	customer: [
		{ key: 'groupName', label: 'ชื่อกลุ่มลูกค้า', required: true, span: 2 },
		{ key: 'taxId', label: 'เลขประจำตัวผู้เสียภาษี' },
		{ key: 'contactName', label: 'ผู้ติดต่อหลัก' },
		{ key: 'contactPhone', label: 'เบอร์โทร' },
		{ key: 'contactEmail', label: 'อีเมล', type: 'email' },
		{ key: 'headOfficeAddress', label: 'ที่อยู่สำนักงานใหญ่', required: true, multiline: true }
	],
	branch: [
		{ key: 'code', label: 'รหัสสาขา', required: true },
		{ key: 'name', label: 'ชื่อสาขา', required: true },
		{ key: 'contactName', label: 'ผู้ติดต่อ' },
		{ key: 'contactPhone', label: 'เบอร์โทร' },
		{ key: 'address', label: 'ที่อยู่', multiline: true }
	],
	contact: [
		{ key: 'name', label: 'ชื่อผู้ติดต่อ', required: true },
		{ key: 'position', label: 'ตำแหน่ง' },
		{ key: 'phone', label: 'เบอร์โทร' },
		{ key: 'email', label: 'อีเมล', type: 'email' }
	]
};
const TITLES = { customer: 'ลูกค้า', branch: 'สาขา', contact: 'ผู้ติดต่อ' };

export default function CustomersPage() {
	const alert = useAlert();
	const qc = useQueryClient();
	const { data, isLoading } = useApi<Customer[]>('/api/customers', { all: 1 });
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const [tab, setTab] = useState<Tab>('ALL');
	const [q, setQ] = useState('');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [dlg, setDlg] = useState<Dlg>(null);
	const [del, setDel] = useState<{ kind: 'customer' | 'branch' | 'contact'; id: string; name: string } | null>(null);

	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter(
			(c) =>
				(tab === 'ALL' || (tab === 'ACTIVE' ? c.isActive : !c.isActive)) &&
				(!k ||
					`${c.groupName} ${c.taxId ?? ''} ${c.contactName ?? ''} ${c.contactEmail ?? ''}`
						.toLowerCase()
						.includes(k))
		);
	}, [list, tab, q]);
	const selected = list.find((c) => c.id === selectedId) ?? null;
	const refresh = () => qc.invalidateQueries({ queryKey: ['/api/customers?all=1'] });
	const path = { customer: '/api/customers', branch: '/api/branches', contact: '/api/contacts' };

	async function save(values: Record<string, string>) {
		if (!dlg) return;

		const isEdit = !!dlg.record?.id;

		try {
			const body = dlg.kind === 'customer' ? values : { ...values, customerGroupId: selected?.id };
			await sendJson(
				isEdit ? `${path[dlg.kind]}/${dlg.record!.id}` : path[dlg.kind],
				isEdit ? 'PATCH' : 'POST',
				body
			);
			alert.showSuccess('บันทึกสำเร็จ');
			setDlg(null);
			await refresh();
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
		}
	}

	async function remove() {
		if (!del) return;

		try {
			await sendJson(`${path[del.kind]}/${del.id}`, 'DELETE');
			alert.showSuccess(del.kind === 'customer' ? 'ปิดใช้งานแล้ว' : 'ลบแล้ว', del.name);
			await refresh();
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
		}

		setDel(null);
	}

	const activeBranches = selected?.branches ?? [];

	return (
		<>
			<PageHeader
				title="ข้อมูลลูกค้า"
				subtitle="กลุ่มลูกค้า สาขา และผู้ติดต่อ ที่ใช้ในใบเสนอราคาและงาน WO"
				actions={
					<Button
						icon={<Plus size={18} />}
						onClick={() => setDlg({ kind: 'customer' })}
					>
						เพิ่มลูกค้า
					</Button>
				}
			/>
			<Card>
				<FilterTabs
					tabs={[
						{ value: 'ALL', label: 'ทั้งหมด', count: list.length },
						{ value: 'ACTIVE', label: 'ใช้งาน', count: list.filter((c) => c.isActive).length },
						{ value: 'INACTIVE', label: 'ปิดใช้งาน', count: list.filter((c) => !c.isActive).length }
					]}
					value={tab}
					onChange={(v) => setTab(v as Tab)}
				/>
				<FilterField
					label="ค้นหา"
					className="max-w-xl"
				>
					{(id) => (
						<SearchInput
							id={id}
							value={q}
							onChange={(e) => setQ(e.target.value)}
							placeholder="ชื่อลูกค้า เลขผู้เสียภาษี หรือผู้ติดต่อ"
						/>
					)}
				</FilterField>
				<DataTable
					loading={isLoading}
					rows={filtered}
					rowKey={(c) => c.id}
					selectedKey={selectedId}
					onRowClick={(c) => setSelectedId(c.id)}
					empty="ไม่พบลูกค้า"
					columns={[
						{
							key: 'g',
							header: 'กลุ่มลูกค้า',
							cell: (c) => (
								<TwoLine
									title={c.groupName}
									sub={c.taxId ? `เลขผู้เสียภาษี ${c.taxId}` : undefined}
								/>
							)
						},
						{
							key: 'h',
							header: 'สำนักงานใหญ่',
							className: 'max-w-72',
							cell: (c) => <span className="line-clamp-2">{c.headOfficeAddress}</span>
						},
						{
							key: 'c',
							header: 'ผู้ติดต่อ',
							cell: (c) => (
								<TwoLine
									title={c.contactName || '-'}
									sub={c.contactEmail}
								/>
							)
						},
						{ key: 'p', header: 'เบอร์โทร', cell: (c) => c.contactPhone || '-' },
						{ key: 'b', header: 'สาขา', align: 'right', cell: (c) => c.branches.length },
						{
							key: 's',
							header: 'สถานะ',
							cell: (c) => (
								<StatusBadge
									label={c.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
									tone={c.isActive ? 'success' : 'neutral'}
								/>
							)
						},
						{
							key: 'act',
							header: <span className="sr-only">การดำเนินการ</span>,
							align: 'right',
							cell: (c) => (
								<div
									className="flex justify-end"
									onClick={(e) => e.stopPropagation()}
								>
									<IconButton
										aria-label={`จัดการสาขาของ ${c.groupName}`}
										onClick={() => setSelectedId(c.id)}
									>
										<Users size={18} />
									</IconButton>
									<IconButton
										aria-label={`แก้ไข ${c.groupName}`}
										onClick={() => setDlg({ kind: 'customer', record: { ...c } as never })}
									>
										<Pencil size={18} />
									</IconButton>
									{c.isActive && (
										<IconButton
											aria-label={`ปิดใช้งาน ${c.groupName}`}
											onClick={() => setDel({ kind: 'customer', id: c.id, name: c.groupName })}
										>
											<Trash2 size={18} />
										</IconButton>
									)}
								</div>
							)
						}
					]}
				/>
			</Card>

			{selected ? (
				<div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] items-start gap-6">
					<Card>
						<CardHeader
							title={`สาขาของ ${selected.groupName}`}
							action={
								<Button
									variant="dashed"
									icon={<Plus size={18} />}
									onClick={() => setDlg({ kind: 'branch' })}
								>
									สาขา
								</Button>
							}
						/>
						<DataTable
							rows={activeBranches}
							rowKey={(b) => b.id}
							empty="ยังไม่มีสาขา"
							columns={[
								{
									key: 'c',
									header: 'รหัสสาขา',
									cell: (b) => <span className="font-semibold">{b.code}</span>
								},
								{
									key: 'n',
									header: 'ชื่อสาขา / ที่อยู่',
									cell: (b) => (
										<TwoLine
											title={b.name}
											sub={b.address}
										/>
									)
								},
								{
									key: 'p',
									header: 'ผู้ติดต่อ',
									cell: (b) => (
										<TwoLine
											title={b.contactName || '-'}
											sub={b.contactPhone}
										/>
									)
								},
								{
									key: 'act',
									header: <span className="sr-only">การดำเนินการ</span>,
									align: 'right',
									cell: (b) => (
										<div className="flex justify-end">
											<IconButton
												aria-label={`แก้ไขสาขา ${b.name}`}
												onClick={() => setDlg({ kind: 'branch', record: { ...b } })}
											>
												<Pencil size={18} />
											</IconButton>
											<IconButton
												aria-label={`ลบสาขา ${b.name}`}
												onClick={() => setDel({ kind: 'branch', id: b.id, name: b.name })}
											>
												<Trash2 size={18} />
											</IconButton>
										</div>
									)
								}
							]}
						/>
					</Card>
					<Card>
						<CardHeader
							title="ผู้ติดต่อ"
							action={
								<Button
									variant="dashed"
									icon={<Plus size={18} />}
									onClick={() => setDlg({ kind: 'contact' })}
								>
									เพิ่มผู้ติดต่อ
								</Button>
							}
						/>
						<DataTable
							rows={selected.contacts}
							rowKey={(c) => c.id}
							empty="ยังไม่มีผู้ติดต่อ"
							columns={[
								{
									key: 'n',
									header: 'ชื่อ / ตำแหน่ง',
									cell: (c) => (
										<TwoLine
											title={c.name}
											sub={c.position}
										/>
									)
								},
								{
									key: 'p',
									header: 'เบอร์โทร / อีเมล',
									cell: (c) => (
										<TwoLine
											title={c.phone || '-'}
											sub={c.email}
										/>
									)
								},
								{
									key: 'act',
									header: <span className="sr-only">การดำเนินการ</span>,
									align: 'right',
									cell: (c) => (
										<div className="flex justify-end">
											<IconButton
												aria-label={`แก้ไข ${c.name}`}
												onClick={() => setDlg({ kind: 'contact', record: { ...c } })}
											>
												<Pencil size={18} />
											</IconButton>
											<IconButton
												aria-label={`ลบ ${c.name}`}
												onClick={() => setDel({ kind: 'contact', id: c.id, name: c.name })}
											>
												<Trash2 size={18} />
											</IconButton>
										</div>
									)
								}
							]}
						/>
					</Card>
				</div>
			) : (
				<p className="text-ink-muted">เลือกลูกค้าจากตารางเพื่อดูสาขาและผู้ติดต่อ</p>
			)}

			<RecordDialog
				open={!!dlg}
				title={dlg ? `${dlg.record?.id ? 'แก้ไข' : 'เพิ่ม'}${TITLES[dlg.kind]}` : ''}
				fields={dlg ? FIELDS[dlg.kind] : []}
				initial={dlg?.record}
				onSubmit={save}
				onClose={() => setDlg(null)}
			/>
			<ConfirmDialog
				open={!!del}
				danger
				title={del?.kind === 'customer' ? 'ปิดใช้งานลูกค้า' : `ลบ${del ? TITLES[del.kind] : ''}`}
				message={`ต้องการ${del?.kind === 'customer' ? 'ปิดใช้งาน' : 'ลบ'} "${del?.name ?? ''}" ใช่หรือไม่ (เอกสารเดิมที่อ้างอิงยังคงอยู่)`}
				confirmLabel="ยืนยัน"
				onClose={() => setDel(null)}
				onConfirm={remove}
			/>
		</>
	);
}
