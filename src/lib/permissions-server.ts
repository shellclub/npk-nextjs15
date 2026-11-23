import prisma from '@/lib/prisma';

export type AccessContext = { role: string; isActive: boolean; menus: string[] };

const TTL_MS = 15_000;

type Entry<T> = { at: number; value: T };
const g = globalThis as unknown as {
	__npkUserCache?: Map<string, Entry<{ role: string; isActive: boolean } | null>>;
	__npkRoleCache?: Map<string, Entry<string[]>>;
};
const userCache: Map<string, Entry<{ role: string; isActive: boolean } | null>> = (g.__npkUserCache ??= new Map());
const roleCache: Map<string, Entry<string[]>> = (g.__npkRoleCache ??= new Map());

const fresh = <T>(e: Entry<T> | undefined): e is Entry<T> => e !== undefined && Date.now() - e.at < TTL_MS;

/** ล้างแคชสิทธิ์ (เรียกหลังแก้ผู้ใช้/สิทธิ์) — proxy อาจใช้แคชแยก จึงมีผลอย่างช้า ~15 วินาที */
export function invalidateAccessCache() {
	userCache.clear();
	roleCache.clear();
}

export async function menusForRole(role: string): Promise<string[]> {
	const hit = roleCache.get(role);

	if (fresh(hit)) return hit.value;

	const rows = await prisma.rolePermission.findMany({
		where: { role: role as never },
		select: { menuKey: true }
	});
	const menus = rows.map((r) => r.menuKey);
	roleCache.set(role, { at: Date.now(), value: menus });

	return menus;
}

/** role (lowercase) + สถานะใช้งาน + เมนูที่เข้าได้ ของผู้ใช้ คืน null ถ้าไม่พบผู้ใช้ */
export async function loadAccess(userId: string): Promise<AccessContext | null> {
	let hit = userCache.get(userId);

	if (!fresh(hit)) {
		const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true } });
		hit = { at: Date.now(), value: u ? { role: u.role, isActive: u.isActive } : null };
		userCache.set(userId, hit);
	}

	if (!hit.value) return null;

	const menus = hit.value.role === 'ADMIN' ? [] : await menusForRole(hit.value.role);

	return { role: hit.value.role.toLowerCase(), isActive: hit.value.isActive, menus };
}
