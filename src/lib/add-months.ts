/** วันสิ้นสุดประกัน = วันเริ่ม + n เดือน (รูปแบบ yyyy-mm-dd; คืน '' ถ้าข้อมูลไม่ครบ) */
export function addMonthsISO(start: string, months: number): string {
	if (!start || !months) return '';

	const d = new Date(`${start}T00:00:00Z`);
	const day = d.getUTCDate();

	d.setUTCDate(1);
	d.setUTCMonth(d.getUTCMonth() + months);

	const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();

	d.setUTCDate(Math.min(day, last));

	return d.toISOString().split('T')[0];
}
