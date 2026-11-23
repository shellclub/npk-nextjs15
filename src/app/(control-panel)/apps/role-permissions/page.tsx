'use client';

import { Check, Lock } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, PageHeader } from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { ROLE_LABEL, type MenuDef } from '@/lib/permissions';
import { sendJson, useApi } from '@/lib/use-api';

type Role = 'MANAGER' | 'STAFF' | 'ACCOUNTANT';
type Grants = Record<Role, string[]>;
type Payload = { roles: Role[]; menus: MenuDef[]; grants: Grants };

export default function RolePermissionsPage() {
	const alert = useAlert();
	const qc = useQueryClient();
	const { data, isLoading } = useApi<Payload>('/api/admin/role-permissions');
	const [grants, setGrants] = useState<Grants | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (data?.grants) setGrants(data.grants);
	}, [data]);

	const groups = useMemo(() => {
		const map = new Map<string, MenuDef[]>();

		for (const m of data?.menus ?? []) map.set(m.group, [...(map.get(m.group) ?? []), m]);

		return [...map.entries()];
	}, [data]);

	const dirty = !!data && !!grants && JSON.stringify(sorted(grants)) !== JSON.stringify(sorted(data.grants));

	function toggle(role: Role, key: string) {
		setGrants((g) => {
			if (!g) return g;

			const has = g[role].includes(key);

			return { ...g, [role]: has ? g[role].filter((k) => k !== key) : [...g[role], key] };
		});
	}

	function toggleGroup(role: Role, keys: string[], on: boolean) {
		setGrants((g) => {
			if (!g) return g;

			const rest = g[role].filter((k) => !keys.includes(k));

			return { ...g, [role]: on ? [...rest, ...keys] : rest };
		});
	}

	async function save() {
		if (!grants) return;

		setSaving(true);

		try {
			await sendJson('/api/admin/role-permissions', 'PUT', { grants });
			alert.showSuccess('บันทึกสิทธิ์แล้ว', 'ผู้ใช้จะเห็นเมนูใหม่เมื่อโหลดหน้าอีกครั้ง');
			await qc.invalidateQueries({ queryKey: ['/api/admin/role-permissions'] });
		} catch (e) {
			alert.showError('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : undefined);
		} finally {
			setSaving(false);
		}
	}

	return (
		<>
			<PageHeader
				title="สิทธิ์การเข้าถึง"
				subtitle="เลือกว่าแต่ละกลุ่มสิทธิ์ (role) เข้าเมนูใดได้บ้าง ใช้ทั้งการแสดงเมนูและการเรียกข้อมูลของระบบ"
				actions={
					<Button
						disabled={!dirty || saving}
						onClick={save}
					>
						บันทึกสิทธิ์
					</Button>
				}
			/>
			<Card>
				{isLoading || !grants || !data ? (
					<p className="text-ink-muted">กำลังโหลด...</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] border-collapse text-left">
							<caption className="sr-only">ตารางสิทธิ์เข้าถึงเมนูตามกลุ่มสิทธิ์</caption>
							<thead>
								<tr className="bg-surface-2">
									<th
										scope="col"
										className="font-display px-4 py-3 text-sm font-semibold"
									>
										เมนู
									</th>
									<th
										scope="col"
										className="font-display px-4 py-3 text-center text-sm font-semibold"
									>
										{ROLE_LABEL.ADMIN}
									</th>
									{data.roles.map((r) => (
										<th
											key={r}
											scope="col"
											className="font-display px-4 py-3 text-center text-sm font-semibold"
										>
											{ROLE_LABEL[r]}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{groups.map(([group, menus]) => (
									<Fragment key={group}>
										<tr className="border-line border-t">
											<th
												scope="rowgroup"
												className="font-display text-ink-muted px-4 pt-4 pb-1 text-xs font-medium tracking-[0.08em]"
											>
												{group}
											</th>
											<td />
											{data.roles.map((r) => {
												const keys = menus.map((m) => m.key);
												const all = keys.every((k) => grants[r].includes(k));

												return (
													<td
														key={r}
														className="px-4 pt-4 pb-1 text-center"
													>
														<button
															type="button"
															onClick={() => toggleGroup(r, keys, !all)}
															className="text-primary-ink focus-visible:outline-focus min-h-11 cursor-pointer text-[13px] underline outline-offset-2 focus-visible:outline-2"
														>
															{all ? 'ล้างทั้งกลุ่ม' : 'เลือกทั้งกลุ่ม'}
															<span className="sr-only">
																{' '}
																{group} ของ {ROLE_LABEL[r]}
															</span>
														</button>
													</td>
												);
											})}
										</tr>
										{menus.map((m) => (
											<tr
												key={m.key}
												className="border-line hover:bg-surface-2 border-t"
											>
												<th
													scope="row"
													className="px-4 py-1 text-[15px] font-normal"
												>
													{m.title}
												</th>
												<td className="px-4 py-1 text-center">
													<span
														className="text-ink-muted inline-flex size-11 items-center justify-center"
														title="ผู้ดูแลระบบเข้าได้ทุกเมนูเสมอ"
													>
														<Lock
															size={16}
															aria-hidden="true"
														/>
														<span className="sr-only">
															{ROLE_LABEL.ADMIN} เข้า {m.title} ได้เสมอ
														</span>
													</span>
												</td>
												{data.roles.map((r) => (
													<td
														key={r}
														className="px-4 py-1 text-center"
													>
														<label className="inline-flex size-11 cursor-pointer items-center justify-center">
															<input
																type="checkbox"
																checked={grants[r].includes(m.key)}
																onChange={() => toggle(r, m.key)}
																className="accent-primary size-5"
															/>
															<span className="sr-only">
																{ROLE_LABEL[r]} เข้า {m.title}
															</span>
														</label>
													</td>
												))}
											</tr>
										))}
									</Fragment>
								))}
							</tbody>
						</table>
					</div>
				)}
				<p className="text-ink-muted flex items-start gap-2 text-[13px]">
					<Check
						size={16}
						aria-hidden="true"
						className="mt-0.5 shrink-0"
					/>
					<span>
						เมนู &quot;จัดการผู้ใช้&quot; และ &quot;สิทธิ์การเข้าถึง&quot; เป็นของผู้ดูแลระบบเท่านั้น
						ข้อมูลหลัก (ลูกค้า ทีมช่าง บริษัท สถานะ) ทุกคนอ่านเพื่อเลือกในฟอร์มได้
						แต่แก้ไขได้เฉพาะผู้มีสิทธิ์เมนูนั้น การเปลี่ยนสิทธิ์มีผลกับการเรียกข้อมูลภายในประมาณ 15 วินาที
					</span>
				</p>
			</Card>
		</>
	);
}

function sorted(g: Grants) {
	return { MANAGER: [...g.MANAGER].sort(), STAFF: [...g.STAFF].sort(), ACCOUNTANT: [...g.ACCOUNTANT].sort() };
}
