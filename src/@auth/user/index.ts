/**
 * ผู้ใช้ที่อยู่ใน session (session.db) มาจากตาราง User ใน Prisma
 */
export type User = {
	id: string;
	/** role แบบ lowercase เช่น 'admin' | 'manager' | 'staff' | 'accountant' */
	role: string[] | string | null;
	displayName: string;
	photoURL?: string;
	email?: string;
};
