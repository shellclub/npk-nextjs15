import Typography from '@mui/material/Typography';

function SignInPageTitle() {
	return (
		<div className="w-full">
			<div className="flex items-center gap-8 mb-4">
				<div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
					<Typography className="text-white font-bold text-xl">N</Typography>
				</div>
				<Typography className="text-lg font-bold text-blue-600">NPK Service</Typography>
			</div>

			<Typography className="mt-8 text-4xl leading-[1.25] font-extrabold tracking-tight">เข้าสู่ระบบ</Typography>
			<div className="mt-0.5 flex items-baseline font-medium">
				<Typography color="text.secondary">ระบบจัดการเอกสารธุรกิจ NPK Service & Supply</Typography>
			</div>
		</div>
	);
}

export default SignInPageTitle;
