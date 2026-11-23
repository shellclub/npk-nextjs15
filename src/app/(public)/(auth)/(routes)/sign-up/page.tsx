import { redirect } from 'next/navigation';

// ไม่เปิดสมัครสมาชิกเอง — ให้ผู้ดูแลระบบสร้างบัญชีให้
export default function SignUpPage() {
	redirect('/sign-in');
}
