import Box from '@mui/material/Box';

function AuthPagesMessageSection() {
	return (
		<Box
			className="relative hidden h-full flex-auto items-center justify-center overflow-hidden p-16 md:flex lg:px-28"
			sx={{
				backgroundColor: 'primary.dark',
				color: 'primary.contrastText'
			}}
		>
			<svg
				className="pointer-events-none absolute inset-0"
				viewBox="0 0 960 540"
				width="100%"
				height="100%"
				preserveAspectRatio="xMidYMax slice"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Box
					component="g"
					className="opacity-5"
					fill="none"
					stroke="currentColor"
					strokeWidth="100"
				>
					<circle
						r="234"
						cx="196"
						cy="23"
					/>
					<circle
						r="234"
						cx="790"
						cy="491"
					/>
				</Box>
			</svg>
			<Box
				component="svg"
				className="absolute -top-16 -right-16 opacity-20"
				sx={{ color: 'primary.light' }}
				viewBox="0 0 220 192"
				width="220px"
				height="192px"
				fill="none"
			>
				<defs>
					<pattern
						id="837c3e70-6c3a-44e6-8854-cc48c737b659"
						x="0"
						y="0"
						width="20"
						height="20"
						patternUnits="userSpaceOnUse"
					>
						<rect
							x="0"
							y="0"
							width="4"
							height="4"
							fill="currentColor"
						/>
					</pattern>
				</defs>
				<rect
					width="220"
					height="192"
					fill="url(#837c3e70-6c3a-44e6-8854-cc48c737b659)"
				/>
			</Box>

			<div className="relative z-10 w-full max-w-4xl">
				<div className="text-7xl leading-none font-bold text-gray-100">
					<div>NPK Service</div>
					<div>& Supply</div>
				</div>
				<div className="mt-6 text-lg leading-6 tracking-tight text-gray-400">
					ระบบจัดการเอกสารธุรกิจครบวงจร สำหรับบริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด
					— ครอบคลุมตั้งแต่ใบเสนอราคา ใบแจ้งหนี้ ใบกำกับภาษี จนถึงใบสำคัญรับ-จ่าย
				</div>
				<div className="mt-8 flex items-center">
					<div className="flex items-center gap-8 px-12 py-6 rounded-full bg-white/10">
						<div className="w-8 h-8 rounded-full bg-green-400" />
						<div className="font-medium tracking-tight text-gray-300">
							ระบบพร้อมใช้งาน
						</div>
					</div>
				</div>
			</div>
		</Box>
	);
}

export default AuthPagesMessageSection;
