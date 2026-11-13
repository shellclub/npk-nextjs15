'use client';

import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useUser from '@auth/useUser';
import {
	Button,
	Card,
	CardHeader,
	DataTable,
	Field,
	IconButton,
	Input,
	PageHeader,
	Select,
	StatusBadge
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { ROLES, ROLE_LABEL, type Role } from '@/lib/permissions';
import { sendJson, useApi } from '@/lib/use-api';

type AppUser = { id: string; email: string; name: string; role: Role; isActive: boolean };

const EMPTY = { email: '', name: '', role: 'STAFF' as Role, password: '' };

export default function UsersPage() {
	const alert = useAlert();
	const qc = useQueryClient();
	const { data: me } = useUser();
	const { data, isLoading } = useApi<AppUser[]>('/api/admin/users');
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const [form, setForm] = useState(EMPTY);
	const [editing, setEditing] = useState<AppUser | null>(null);
	const [saving, setSaving] = useState(false);
	const refresh = () =>
		qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('/api/admin/users') });
	const isSelf = !!editing && editing.id === me?.id;

	function reset() {
		setForm(EMPTY);
		setEditing(null);
	}

	function edit(u: AppUser) {
		setEditing(u);
		setForm({ email: u.email, name: u.name, role: u.role, password: '' });
	}

	async function save() {
		if (!form.name.trim() || (!editing && !form.email.trim())) {
			alert.showWarning('กรุณากรอกชื่อและอีเมล');

			return;
		}

		setSaving(true);

		try {
			if (editing) {
				await sendJson(`/api/admin/users/${editing.id}`, 'PATCH', {
					name: form.name,
					...(isSelf ? {} : { role: form.role }),
					...(form.password ? { password: form.password } : {})
				});
			} else {
				await sendJson('/api/admin/users', 'POST', form);
			}

			alert.showSuccess(editing ? 'บันทึกแล้ว' : 'เพิ่มผู้ใช้สำเร็จ');
			reset();
			await refresh();
		} catch (e) {
			alert.showError('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : undefined);
		} finally {
			setSaving(false);
		}
	}

	async function toggleActive(u: AppUser) {
		try {
			await sendJson(`/api/admin/users/${u.id}`, 'PATCH', { isActive: !u.isActive });
			await refresh();
		} catch (e) {
			alert.showError('เปลี่ยนสถานะไม่สำเร็จ', e instanceof Error ? e.message : undefined);
		}
	}

	return (
		<>
			<PageHeader
				title="จัดการผู้ใช้"
				subtitle="เพิ่มผู้ใช้ กำหนดกลุ่มสิทธิ์ (role) รีเซ็ตรหัสผ่าน และปิดการใช้งานบัญชี"
			/>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] items-start gap-6 min-[1100px]:grid-cols-[2fr_1fr]">
				<Card>
					<DataTable
						loading={isLoading}
						rows={list}
						rowKey={(u) => u.id}
						empty="ยังไม่มีผู้ใช้"
						columns={[
							{
								key: 'n',
								header: 'ชื่อ',
								cell: (u) => (
									<div>
										<div className="font-medium">{u.name}</div>
										<div className="text-ink-muted text-[13px]">{u.email}</div>
									</div>
								)
							},
							{
								key: 'r',
								header: 'กลุ่มสิทธิ์',
								cell: (u) => (
									<StatusBadge
										label={ROLE_LABEL[u.role]}
										tone={u.role === 'ADMIN' ? 'info' : 'neutral'}
									/>
								)
							},
							{
								key: 'a',
								header: 'ใช้งาน',
								cell: (u) => (
									<label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
										<input
											type="checkbox"
											checked={u.isActive}
											disabled={u.id === me?.id}
											onChange={() => toggleActive(u)}
											className="accent-primary size-5"
										/>
										<span className="sr-only">เปิดใช้งาน {u.name}</span>
									</label>
								)
							},
							{
								key: 'act',
								header: <span className="sr-only">การดำเนินการ</span>,
								align: 'right',
								cell: (u) => (
									<IconButton
										aria-label={`แก้ไข ${u.name}`}
										onClick={() => edit(u)}
									>
										<Pencil size={18} />
									</IconButton>
								)
							}
						]}
					/>
					<p className="text-ink-muted text-[13px]">
						ปิดการใช้งานแล้วผู้ใช้จะเข้าระบบไม่ได้ทันที (ไม่ลบข้อมูล) บัญชีของตัวเองปิดหรือลดสิทธิ์ไม่ได้
					</p>
				</Card>

				<Card>
					<CardHeader title={editing ? `แก้ไข: ${editing.name}` : 'เพิ่มผู้ใช้'} />
					<Field
						label="อีเมล (ใช้เข้าสู่ระบบ)"
						required
					>
						{(id) => (
							<Input
								id={id}
								type="email"
								value={form.email}
								disabled={!!editing}
								onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
							/>
						)}
					</Field>
					<Field
						label="ชื่อที่แสดง"
						required
					>
						{(id) => (
							<Input
								id={id}
								value={form.name}
								onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							/>
						)}
					</Field>
					<Field
						label="กลุ่มสิทธิ์"
						hint={
							isSelf
								? 'เปลี่ยนกลุ่มสิทธิ์ของตัวเองไม่ได้'
								: 'กำหนดเมนูที่เข้าได้ที่หน้า "สิทธิ์การเข้าถึง"'
						}
					>
						{(id) => (
							<Select
								id={id}
								value={form.role}
								disabled={isSelf}
								onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
							>
								{ROLES.map((r) => (
									<option
										key={r}
										value={r}
									>
										{ROLE_LABEL[r]}
									</option>
								))}
							</Select>
						)}
					</Field>
					<Field
						label={editing ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'}
						required={!editing}
						hint="อย่างน้อย 8 ตัวอักษร"
					>
						{(id) => (
							<Input
								id={id}
								type="password"
								autoComplete="new-password"
								value={form.password}
								onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
							/>
						)}
					</Field>
					<div className="flex gap-3">
						<Button
							disabled={saving}
							onClick={save}
						>
							{editing ? 'บันทึก' : 'เพิ่มผู้ใช้'}
						</Button>
						<Button
							variant="ghost"
							onClick={reset}
						>
							ล้างฟอร์ม
						</Button>
					</div>
				</Card>
			</div>
		</>
	);
}
