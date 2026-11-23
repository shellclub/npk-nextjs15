/** ดาวน์โหลด CSV (UTF-8 BOM เพื่อให้ Excel อ่านภาษาไทยได้) */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
	const esc = (v: string | number | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
	const body = [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
	const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff), body], { type: 'text/csv;charset=utf-8' }));
	const a = document.createElement('a');

	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
