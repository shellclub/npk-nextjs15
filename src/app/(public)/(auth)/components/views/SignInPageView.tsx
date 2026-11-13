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
		defaultValues: { email: '', password: '', remember: false }
	});

	async function onSubmit({ email, password }: FormType) {
		const result = await signIn('credentials', { email, password, formType: 'signin', redirect: false });

		if (result?.error) setError('root', { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
	}

	return (
		<main className="bg-canvas text-ink flex min-h-screen items-center justify-center p-4 md:px-8 md:py-12">
			<div className="flex w-full max-w-[1200px] flex-wrap items-center">
				<section
					aria-label="เกี่ยวกับระบบ NPK Service"
					className="bg-brand text-on-brand relative flex min-h-0 min-w-0 flex-[1_1_520px] flex-col gap-8 overflow-hidden rounded-3xl px-6 pt-10 pb-20 md:min-h-[680px] md:py-14 md:pr-[120px] md:pl-14"
				>
					<svg
						aria-hidden="true"
						width="360"
						height="360"
						viewBox="0 0 360 360"
						className="absolute -right-20 -bottom-20"
					>
						<circle
							cx="180"
							cy="180"
							r="180"
							className="fill-brand-soft"
						/>
						<circle
							cx="180"
							cy="180"
							r="112"
							className="fill-brand"
						/>
						<circle
							cx="180"
							cy="180"
							r="48"
							className="fill-accent"
						/>
					</svg>
					<svg
						aria-hidden="true"
						width="96"
						height="96"
						viewBox="0 0 96 96"
						className="absolute top-12 right-16"
					>
						<circle
							cx="48"
							cy="48"
							r="48"
							className="fill-brand-soft"
						/>
					</svg>

					<div className="relative flex items-center gap-4">
						<div className="bg-surface flex size-[88px] flex-none items-center justify-center rounded-[20px]">
							<Image
								src="/api/company/asset/logo"
								unoptimized
								alt="โลโก้ NPK Service & Supply"
								width={64}
								height={64}
								className="h-auto w-16"
								priority
							/>
						</div>
						<div>
							<div className="font-display text-[28px] leading-9 font-semibold">NPK Service</div>
							<div className="text-base leading-6">NPK Service &amp; Supply Co., Ltd.</div>
						</div>
					</div>

					<div className="relative flex max-w-[460px] flex-col gap-3">
						<h1 className="font-display text-4xl leading-[50px] font-semibold">
							งานบริการ เอกสาร การเงิน
							<br />
							ครบจบในระบบเดียว
						</h1>
						<p className="text-[17px] leading-7">
							ระบบจัดการงานของบริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด ตั้งแต่ใบเสนอราคา รับงาน
							สั่งงานช่าง จนถึงวางบิลและรับชำระเงิน
						</p>
					</div>

					<ul className="relative mt-auto flex max-w-[440px] flex-col gap-4">
						{FEATURES.map(({ Icon, text }) => (
							<li
								key={text}
								className="flex items-center gap-4"
							>
								<span
									aria-hidden="true"
									className="bg-surface text-primary-ink flex size-11 flex-none items-center justify-center rounded-full"
								>
									<Icon size={22} />
								</span>
								<span className="text-base leading-6">{text}</span>
							</li>
						))}
					</ul>
				</section>

				<section
					aria-labelledby="login-title"
					className="bg-surface shadow-float relative -mt-10 flex max-w-none min-w-0 flex-[1_1_400px] flex-col gap-6 rounded-3xl p-6 md:mt-0 md:-ml-16 md:max-w-[520px] md:p-12"
				>
					<div className="flex flex-col gap-2">
						<h2
							id="login-title"
							className="font-display text-[28px] leading-10 font-semibold"
						>
							เข้าสู่ระบบ
						</h2>
						<p className="text-ink-muted text-base leading-[26px]">
							ระบบจัดการเอกสารธุรกิจ NPK Service &amp; Supply
						</p>
					</div>

					<form
						noValidate
						onSubmit={handleSubmit(onSubmit)}
						className="flex flex-col gap-5"
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
										size={20}
										className="text-ink-muted pointer-events-none absolute top-3.5 left-3.5"
									/>
									<Input
										id={id}
										type="email"
										autoComplete="username"
										placeholder="name@npkservice.co.th"
										aria-invalid={bad}
										className="h-12 rounded-lg pr-4 pl-11 text-base"
										{...register('email')}
									/>
								</div>
							)}
						</Field>
						<Field
							label="รหัสผ่าน"
							error={errors.password?.message}
							action={
								<a
									href="mailto:?subject=ขอรีเซ็ตรหัสผ่านระบบ NPK"
									className="font-display text-sm font-medium no-underline"
								>
									ลืมรหัสผ่าน?
								</a>
							}
						>
							{(id, bad) => (
								<div className="relative">
									<Lock
										aria-hidden="true"
										size={20}
										className="text-ink-muted pointer-events-none absolute top-3.5 left-3.5"
									/>
									<Input
										id={id}
										type={show ? 'text' : 'password'}
										autoComplete="current-password"
										placeholder="กรอกรหัสผ่าน"
										aria-invalid={bad}
										className="h-12 rounded-lg pr-[52px] pl-11 text-base"
										{...register('password')}
									/>
									<IconButton
										aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
										className="absolute top-0.5 right-0.5"
										onClick={() => setShow((s) => !s)}
									>
										{show ? <EyeOff size={20} /> : <Eye size={20} />}
									</IconButton>
								</div>
							)}
						</Field>
						<label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-base">
							<input
								type="checkbox"
								className="accent-brand m-0 size-5"
								{...register('remember')}
							/>
							จดจำการเข้าสู่ระบบ
						</label>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="h-12 w-full rounded-lg"
						>
							{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
						</Button>
					</form>

					<div className="border-line flex flex-col gap-2 border-t pt-5">
						<p className="text-ink-muted text-[15px] leading-6">
							ยังไม่มีบัญชี? <span className="font-semibold">ติดต่อผู้ดูแลระบบ</span>
						</p>
						<p className="text-ink-muted flex items-start gap-2 text-[13px] leading-5">
							<ShieldCheck
								size={16}
								aria-hidden="true"
								className="mt-0.5 flex-none"
							/>
							บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด · สำหรับพนักงานที่ได้รับสิทธิ์เท่านั้น
						</p>
					</div>
				</section>
			</div>
		</main>
	);
}

export default SignInPageView;
