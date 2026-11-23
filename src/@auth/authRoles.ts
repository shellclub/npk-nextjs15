/** กลุ่ม role ที่ใช้กับ AuthGuardRedirect (ค่า role เป็นตัวพิมพ์เล็กตาม UserRole ใน Prisma) */
const authRoles = {
	/** ทุก role ที่เข้าระบบหลังบ้านได้ */
	staff: ['admin', 'manager', 'staff', 'accountant'],
	/** เฉพาะผู้ที่ยังไม่ล็อกอิน */
	onlyGuest: [] as string[]
};

export default authRoles;
