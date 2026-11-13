'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, FileText, Lock, Mail, ShieldCheck, Wallet, Wrench } from 'lucide-react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Field, IconButton, Input } from '@/components/ui';

const schema = z.object({
	email: z.string().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
	password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
	remember: z.boolean().optional()
});
type FormType = z.infer<typeof schema>;

const FEATURES = [
	{ Icon: FileText, text: 'ใบเสนอราคา → ตอบรับงาน WO/PO → ใบสั่งซื้อให้ช่าง' },
	{ Icon: Wrench, text: 'ติดตามสถานะงานและงานเสร็จรอจ่ายช่าง' },
	{ Icon: Wallet, text: 'ใบแจ้งหนี้ ใบกำกับภาษี ใบสำคัญรับ-จ่าย และ 50 ทวิ' }
];

/** หน้าเข้าสู่ระบบ NPK Service (พาเนลเขียว + การ์ดฟอร์มซ้อนทับ) */
function SignInPageView() {
	const [show, setShow] = useState(false);
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting }
	} = useForm<FormType>({
		resolver: zodResolver(schema),
		defaultValues: { email: '', password: '', remember: true }
	});

	async function onSubmit({ email, password }: FormType) {
		const result = await signIn('credentials', { email, password, formType: 'signin', redirect: false });

		if (result?.error) setError('root', { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
	}

	return (
		<main className="bg-canvas flex min-h-screen flex-col md:flex-row">
			<section className="bg-brand text-on-brand relative flex flex-1 flex-col justify-center gap-8 overflow-hidden px-8 py-12 md:px-16 md:pr-32">
				<span
					aria-hidden="true"
					className="bg-brand-soft/40 absolute -top-24 -right-24 size-72 rounded-full"
				/>
				<span
					aria-hidden="true"
					className="bg-brand-soft/30 absolute -bottom-32 left-10 size-96 rounded-full"
				/>
				<div className="relative flex items-center gap-4">
					<div className="bg-surface flex size-[60px] items-center justify-center rounded-xl">
						<Image
							src="/api/company/asset/logo"
							unoptimized
							alt="โลโก้ NPK Service & Supply"
							width={44}
							height={44}
							className="h-auto w-11"
							priority
						/>
					</div>
					<div>
						<div className="font-display text-2xl font-semibold">NPK Service</div>
						<div className="text-[15px]">NPK Service &amp; Supply Co., Ltd.</div>
					</div>
				</div>
				<div className="relative flex max-w-xl flex-col gap-4">
					<h1 className="font-display text-4xl leading-tight font-semibold">
						งานบริการ เอกสาร การเงิน
						<br />
						ครบจบในระบบเดียว
					</h1>
					<p className="text-[17px] leading-7">
						ระบบจัดการงานของบริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด ตั้งแต่ใบเสนอราคา รับงาน
						สั่งงานช่าง จนถึงวางบิลและรับชำระเงิน
					</p>
				</div>
				<ul className="relative flex max-w-xl flex-col gap-3">
					{FEATURES.map(({ Icon, text }) => (
						<li
							key={text}
							className="flex items-center gap-3 text-[15px]"
						>
							<span
								aria-hidden="true"
								className="bg-surface/30 flex size-10 shrink-0 items-center justify-center rounded-lg"
							>
								<Icon size={20} />
							</span>
							{text}
						</li>
					))}
				</ul>
			</section>

			<section className="relative z-10 flex items-center justify-center px-4 py-10 md:-ml-16 md:w-[520px] md:shrink-0 md:px-0 md:pr-12">
				<div className="bg-surface shadow-float w-full max-w-md rounded-3xl p-8 sm:p-10">
					<h2 className="font-display text-[26px] leading-9 font-semibold">เข้าสู่ระบบ</h2>
					<p className="text-ink-muted mb-6">ระบบจัดการเอกสารธุรกิจ NPK Service &amp; Supply</p>
					<form
						noValidate
						onSubmit={handleSubmit(onSubmit)}
						className="flex flex-col gap-4"
					>
						{errors.root && (
							<p
								role="alert"
								className="bg-danger-soft text-danger rounded-lg px-4 py-2.5"
							>
								{errors.root.message}
							</p>
						)}
						<Field
							label="อีเมล"
							error={errors.email?.message}
						>
							{(id, bad) => (
								<div className="relative">
									<Mail
										aria-hidden="true"
										size={18}
										className="text-ink-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
									/>
									<Input
										id={id}
										type="email"
										autoComplete="username"
										aria-invalid={bad}
										className="pl-11"
										{...register('email')}
									/>
								</div>
							)}
						</Field>
						<Field
							label="รหัสผ่าน"
							error={errors.password?.message}
						>
							{(id, bad) => (
								<div className="relative">
									<Lock
										aria-hidden="true"
										size={18}
										className="text-ink-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
									/>
									<Input
										id={id}
										type={show ? 'text' : 'password'}
										autoComplete="current-password"
										aria-invalid={bad}
										className="pr-12 pl-11"
										{...register('password')}
									/>
									<IconButton
										aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
										className="absolute top-0 right-0"
										onClick={() => setShow((s) => !s)}
									>
										{show ? <EyeOff size={18} /> : <Eye size={18} />}
									</IconButton>
								</div>
							)}
						</Field>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<label className="flex min-h-11 cursor-pointer items-center gap-2">
								<input
									type="checkbox"
									className="accent-primary size-5"
									{...register('remember')}
								/>
								จดจำการเข้าสู่ระบบ
							</label>
							<a
								href="mailto:?subject=ขอรีเซ็ตรหัสผ่านระบบ NPK"
								className="text-sm"
							>
								ลืมรหัสผ่าน?
							</a>
						</div>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="w-full"
						>
							{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
						</Button>
					</form>
					<p className="text-ink-muted mt-6 text-center text-sm">ยังไม่มีบัญชี? ติดต่อผู้ดูแลระบบ</p>
					<p className="text-ink-muted mt-3 flex items-center justify-center gap-2 text-center text-[13px]">
						<ShieldCheck
							size={16}
							aria-hidden="true"
						/>
						บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด · สำหรับพนักงานที่ได้รับสิทธิ์เท่านั้น
					</p>
				</div>
			</section>
		</main>
	);
}

export default SignInPageView;
