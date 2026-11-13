'use client';

import { Pencil, Phone, Plus, RotateCcw, Trash2, Users } from 'lucide-react';
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

type Member = { id: string; name: string; phone?: string | null; idCard?: string | null };
type Team = {
	id: string;
	teamName: string;
	leaderName: string;
	leaderPhone?: string | null;
	leaderIdCard?: string | null;
	leaderAddress?: string | null;
	isActive: boolean;
	members: Member[];
};
type Tab = 'ALL' | 'ACTIVE' | 'INACTIVE';
type Dlg = { kind: 'team' | 'member'; record?: Record<string, string | null | undefined> & { id?: string } } | null;

const FIELDS: Record<'team' | 'member', RecordField[]> = {
	team: [
		{ key: 'teamName', label: 'ชื่อทีมช่าง', required: true, span: 2 },
		{ key: 'leaderName', label: 'หัวหน้าช่าง', required: true },
		{ key: 'leaderPhone', label: 'เบอร์โทรหัวหน้า' },
		{ key: 'leaderIdCard', label: 'เลขบัตรประชาชนหัวหน้า' },
		{ key: 'leaderAddress', label: 'ที่อยู่หัวหน้า', multiline: true }
	],
	member: [
		{ key: 'name', label: 'ชื่อสมาชิก', required: true, span: 2 },
		{ key: 'phone', label: 'เบอร์โทร' },
		{ key: 'idCard', label: 'เลขบัตรประชาชน' }
	]
};

export default function TechniciansPage() {
	const alert = useAlert();
	const qc = useQueryClient();
	const { data, isLoading } = useApi<Team[]>('/api/technician-teams', { all: 1 });
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const [tab, setTab] = useState<Tab>('ALL');
	const [q, setQ] = useState('');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [dlg, setDlg] = useState<Dlg>(null);
	const [del, setDel] = useState<{ kind: 'team' | 'member'; id: string; name: string } | null>(null);
	const selected = list.find((t) => t.id === selectedId) ?? null;
	const refresh = () => qc.invalidateQueries({ queryKey: ['/api/technician-teams?all=1'] });

	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter(
			(t) =>
				(tab === 'ALL' || (tab === 'ACTIVE' ? t.isActive : !t.isActive)) &&
				(!k || `${t.teamName} ${t.leaderName} ${t.leaderPhone ?? ''}`.toLowerCase().includes(k))
		);
	}, [list, tab, q]);

	async function save(values: Record<string, string>) {
		if (!dlg) return;

		const id = dlg.record?.id;

		try {
			if (dlg.kind === 'team')
				await sendJson(
					id ? `/api/technician-teams/${id}` : '/api/technician-teams',
					id ? 'PATCH' : 'POST',
					values
				);
			else
				await sendJson(
					id ? `/api/team-members/${id}` : `/api/technician-teams/${selected?.id}/members`,
					id ? 'PATCH' : 'POST',
					values
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
			await sendJson(
				del.kind === 'team' ? `/api/technician-teams/${del.id}` : `/api/team-members/${del.id}`,
				'DELETE'
			);
			alert.showSuccess(del.kind === 'team' ? 'ปิดใช้งานแล้ว' : 'ลบแล้ว', del.name);
			await refresh();
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
		}

		setDel(null);
	}

	async function reactivate(t: Team) {
		try {
			await sendJson(`/api/technician-teams/${t.id}`, 'PATCH', { isActive: true });
			await refresh();
		} catch {
			alert.showError('เกิดข้อผิดพลาด');
		}
	}

	return (
		<>
			<PageHeader
				title="ข้อมูลทีมช่าง"
				subtitle="ทีมช่าง หัวหน้า และสมาชิก ที่ใช้มอบหมายงานและออกใบสั่งซื้อ"
				actions={
					<Button
						icon={<Plus size={18} />}
						onClick={() => setDlg({ kind: 'team' })}
					>
						เพิ่มทีมช่าง
					</Button>
				}
			/>
			<Card>
				<FilterTabs
					tabs={[
						{ value: 'ALL', label: 'ทั้งหมด', count: list.length },
						{ value: 'ACTIVE', label: 'ใช้งาน', count: list.filter((t) => t.isActive).length },
						{ value: 'INACTIVE', label: 'ปิดใช้งาน', count: list.filter((t) => !t.isActive).length }
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
							placeholder="ชื่อทีม หัวหน้าช่าง หรือเบอร์โทร"
						/>
					)}
				</FilterField>
				<DataTable
					loading={isLoading}
					rows={filtered}
					rowKey={(t) => t.id}
					selectedKey={selectedId}
					onRowClick={(t) => setSelectedId(t.id)}
					empty="ไม่พบทีมช่าง"
					columns={[
						{
							key: 'n',
							header: 'ชื่อทีม',
							cell: (t) => <span className="font-semibold">{t.teamName}</span>
						},
						{
							key: 'l',
							header: 'หัวหน้าช่าง',
							cell: (t) => (
								<TwoLine
									title={t.leaderName}
									sub={t.leaderIdCard ? `บัตร ${t.leaderIdCard}` : undefined}
								/>
							)
						},
						{ key: 'p', header: 'เบอร์โทรหัวหน้า', cell: (t) => t.leaderPhone || '-' },
						{
							key: 'm',
							header: 'สมาชิก',
							cell: (t) =>
								t.members.length ? (
									`${t.members.length} คน`
								) : (
									<span className="text-ink-muted">ยังไม่มีสมาชิก</span>
								)
						},
						{
							key: 's',
							header: 'สถานะ',
							cell: (t) => (
								<StatusBadge
									label={t.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
									tone={t.isActive ? 'success' : 'neutral'}
								/>
							)
						},
						{
							key: 'act',
							header: <span className="sr-only">การดำเนินการ</span>,
							align: 'right',
							cell: (t) => (
								<div
									className="flex justify-end"
									onClick={(e) => e.stopPropagation()}
								>
									<IconButton
										aria-label={`จัดการสมาชิกของ ${t.teamName}`}
										onClick={() => setSelectedId(t.id)}
									>
										<Users size={18} />
									</IconButton>
									<IconButton
										aria-label={`แก้ไข ${t.teamName}`}
										onClick={() => setDlg({ kind: 'team', record: { ...t } as never })}
									>
										<Pencil size={18} />
									</IconButton>
									{t.isActive ? (
										<IconButton
											aria-label={`ปิดใช้งาน ${t.teamName}`}
											onClick={() => setDel({ kind: 'team', id: t.id, name: t.teamName })}
										>
											<Trash2 size={18} />
										</IconButton>
									) : (
										<IconButton
											aria-label={`เปิดใช้งาน ${t.teamName} อีกครั้ง`}
											onClick={() => reactivate(t)}
										>
											<RotateCcw size={18} />
										</IconButton>
									)}
								</div>
							)
						}
					]}
				/>
			</Card>

			{selected ? (
				<Card>
					<CardHeader
						title={`สมาชิกทีม ${selected.teamName}`}
						action={
							<Button
								variant="dashed"
								icon={<Plus size={18} />}
								onClick={() => setDlg({ kind: 'member' })}
							>
								เพิ่มสมาชิก
							</Button>
						}
					/>
					{selected.members.length === 0 ? (
						<p className="text-ink-muted">ยังไม่มีสมาชิก</p>
					) : (
						<ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
							{selected.members.map((m) => (
								<li
									key={m.id}
									className="bg-surface-2 ring-line flex items-start justify-between gap-2 rounded-2xl p-4 ring-1"
								>
									<div>
										<div className="font-display font-semibold">{m.name}</div>
										<div className="text-ink-muted flex items-center gap-1.5 text-sm">
											<Phone
												size={14}
												aria-hidden="true"
											/>
											{m.phone || '-'}
										</div>
										{m.idCard && <div className="text-ink-muted text-[13px]">บัตร {m.idCard}</div>}
									</div>
									<div className="flex">
										<IconButton
											aria-label={`แก้ไข ${m.name}`}
											onClick={() => setDlg({ kind: 'member', record: { ...m } })}
										>
											<Pencil size={18} />
										</IconButton>
										<IconButton
											aria-label={`ลบ ${m.name}`}
											onClick={() => setDel({ kind: 'member', id: m.id, name: m.name })}
										>
											<Trash2 size={18} />
										</IconButton>
									</div>
								</li>
							))}
						</ul>
					)}
				</Card>
			) : (
				<p className="text-ink-muted">เลือกทีมช่างจากตารางเพื่อดูสมาชิก</p>
			)}

			<RecordDialog
				open={!!dlg}
				title={dlg ? `${dlg.record?.id ? 'แก้ไข' : 'เพิ่ม'}${dlg.kind === 'team' ? 'ทีมช่าง' : 'สมาชิก'}` : ''}
				fields={dlg ? FIELDS[dlg.kind] : []}
				initial={dlg?.record}
				onSubmit={save}
				onClose={() => setDlg(null)}
			/>
			<ConfirmDialog
				open={!!del}
				danger
				title={del?.kind === 'team' ? 'ปิดใช้งานทีมช่าง' : 'ลบสมาชิก'}
				message={`ต้องการ${del?.kind === 'team' ? 'ปิดใช้งาน' : 'ลบ'} "${del?.name ?? ''}" ใช่หรือไม่`}
				confirmLabel="ยืนยัน"
				onClose={() => setDel(null)}
				onConfirm={remove}
			/>
		</>
	);
}
