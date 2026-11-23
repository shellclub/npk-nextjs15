'use client';

import { useState } from 'react';
import useUser from '@auth/useUser';
import { Button, Card, CardHeader, Field, Input, PageHeader } from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { ROLE_LABEL, type Role } from '@/lib/permissions';
import { sendJson } from '@/lib/use-api';

const EMPTY = { currentPassword: '', newPassword: '', confirm: '' };

export default function AccountPage() {
	const alert = useAlert();
	const { data: user } = useUser();
	const role = (Array.isArray(user?.role) ? user.role[0] : user?.role)?.toUpperCase() as Role | undefined;
	const [form, setForm] = useState(EMPTY);
	const [saving, setSaving] = useState(false);

	async function save() {
		if (form.newPassword.length < 8) {
			alert.showWarning('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');

			return;
		}

		if (form.newPassword !== form.confirm) {
			alert.showWarning('ยืนยันรหัสผ่านไม่ตรงกัน');

			return;
		}

		setSaving(true);

		try {
			await sendJson('/api/account/password', 'POST', {
				currentPassword: form.currentPassword,
				newPassword: form.newPassword
			});
			alert.showSuccess('เปลี่ยนรหัสผ่านแล้ว');
			setForm(EMPTY);
		} catch (e) {
			alert.showError('เปลี่ยนรหัสผ่านไม่สำเร็จ', e instanceof Error ? e.message : undefined);
		} finally {
			setSaving(false);
		}
	}

	return (
		<>
			<PageHeader
				title="บัญชีของฉัน"
				subtitle={`${user?.displayName ?? ''} · ${user?.email ?? ''}${role ? ` · ${ROLE_LABEL[role] ?? role}` : ''}`}
			/>
			<div className="max-w-xl">
				<Card>
					<CardHeader title="เปลี่ยนรหัสผ่าน" />
					<Field
						label="รหัสผ่านปัจจุบัน"
						required
					>
						{(id) => (
							<Input
								id={id}
								type="password"
								autoComplete="current-password"
								value={form.currentPassword}
								onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
							/>
						)}
					</Field>
					<Field
						label="รหัสผ่านใหม่"
						required
						hint="อย่างน้อย 8 ตัวอักษร"
					>
						{(id) => (
							<Input
								id={id}
								type="password"
								autoComplete="new-password"
								value={form.newPassword}
								onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
							/>
						)}
					</Field>
					<Field
						label="ยืนยันรหัสผ่านใหม่"
						required
					>
						{(id) => (
							<Input
								id={id}
								type="password"
								autoComplete="new-password"
								value={form.confirm}
								onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
							/>
						)}
					</Field>
					<div>
						<Button
							disabled={saving}
							onClick={save}
						>
							บันทึกรหัสผ่านใหม่
						</Button>
					</div>
				</Card>
			</div>
		</>
	);
}
