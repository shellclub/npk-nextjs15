'use client';

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({
  '& .container': {
    maxWidth: '100%!important',
  },
}));

// Mock company data
const companyData = {
	nameTh: 'บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด',
	nameEn: 'NPK SERVICE & SUPPLY CO.,LTD',
	addressTh: 'สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000',
	addressEn: 'Head Office : 210/19 Moo.4, Tombon Sanamchai, Amphur Mueang Suphanburi, Suphanburi 72000',
	taxId: '0105555161084',
	phones: ['09-8942-9891', '06-5961-9799', '09-3694-4591'],
	email: 'npkservicesupply@gmail.com',
	bankAccounts: [
		{
			id: '1',
			bank: 'ธนาคารกสิกรไทย',
			branch: 'สาขาสุพรรณบุรี',
			accountName: 'บจ. เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย',
			accountNumber: 'xxx-x-xxxxx-x',
			type: 'ออมทรัพย์',
		},
		{
			id: '2',
			bank: 'ธนาคารกรุงเทพ',
			branch: 'สาขาสุพรรณบุรี',
			accountName: 'บจ. เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย',
			accountNumber: 'xxx-x-xxxxx-x',
			type: 'กระแสรายวัน',
		},
	],
};

function CompanySettingsPage() {
	const [saved, setSaved] = useState(false);

	return (
		<Root
			header={
				<div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between py-24 px-24 md:px-32 gap-16">
					<motion.div
						initial={{ x: -20, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
					>
						<Typography className="text-24 md:text-32 font-extrabold tracking-tight leading-none">
							ข้อมูลบริษัท
						</Typography>
						<Typography className="text-14 font-medium mt-2" color="text.secondary">
							ตั้งค่าข้อมูลบริษัทสำหรับเอกสาร
						</Typography>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
					>
						<Button
							variant="contained"
							color="secondary"
							startIcon={<FuseSvgIcon size={20}>lucide:save</FuseSvgIcon>}
							onClick={() => setSaved(true)}
							size="large"
						>
							บันทึกข้อมูล
						</Button>
					</motion.div>
				</div>
			}
			content={
				<div className="w-full px-24 md:px-32 pb-32">
					{/* Company Information Section */}
					<Paper className="w-full rounded-xl shadow-sm p-24 md:p-32 mb-24">
						<div className="flex items-center gap-8 mb-24">
							<FuseSvgIcon className="text-blue-500" size={24}>lucide:building-2</FuseSvgIcon>
							<Typography className="text-18 font-bold">ข้อมูลบริษัท</Typography>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-20">
							<TextField
								label="ชื่อบริษัท (ภาษาไทย)"
								fullWidth
								defaultValue={companyData.nameTh}
								variant="outlined"
								size="medium"
							/>
							<TextField
								label="ชื่อบริษัท (ภาษาอังกฤษ)"
								fullWidth
								defaultValue={companyData.nameEn}
								variant="outlined"
								size="medium"
							/>
							<TextField
								label="ที่อยู่ (ภาษาไทย)"
								fullWidth
								multiline
								rows={3}
								defaultValue={companyData.addressTh}
								variant="outlined"
								className="md:col-span-2"
							/>
							<TextField
								label="ที่อยู่ (ภาษาอังกฤษ)"
								fullWidth
								multiline
								rows={3}
								defaultValue={companyData.addressEn}
								variant="outlined"
								className="md:col-span-2"
							/>
							<TextField
								label="เลขประจำตัวผู้เสียภาษี"
								fullWidth
								defaultValue={companyData.taxId}
								variant="outlined"
								size="medium"
							/>
							<TextField
								label="อีเมล"
								fullWidth
								defaultValue={companyData.email}
								variant="outlined"
								size="medium"
							/>
						</div>
					</Paper>

					{/* Contact Information Section */}
					<Paper className="w-full rounded-xl shadow-sm p-24 md:p-32 mb-24">
						<div className="flex items-center justify-between mb-24">
							<div className="flex items-center gap-8">
								<FuseSvgIcon className="text-green-500" size={24}>lucide:phone</FuseSvgIcon>
								<Typography className="text-18 font-bold">เบอร์ติดต่อ</Typography>
							</div>
							<Button
								variant="outlined"
								size="small"
								startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
							>
								เพิ่มเบอร์
							</Button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-20">
							{companyData.phones.map((phone, index) => (
								<div key={index} className="flex items-start gap-8">
									<TextField
										label={`เบอร์โทร ${index + 1}`}
										fullWidth
										defaultValue={phone}
										variant="outlined"
										size="medium"
									/>
									{index > 0 && (
										<Tooltip title="ลบเบอร์นี้">
											<IconButton color="error" className="mt-8">
												<FuseSvgIcon size={18}>lucide:x</FuseSvgIcon>
											</IconButton>
										</Tooltip>
									)}
								</div>
							))}
						</div>
					</Paper>

					{/* Bank Accounts Section */}
					<Paper className="w-full rounded-xl shadow-sm p-24 md:p-32">
						<div className="flex items-center justify-between mb-24">
							<div className="flex items-center gap-8">
								<FuseSvgIcon className="text-purple-500" size={24}>lucide:landmark</FuseSvgIcon>
								<Typography className="text-18 font-bold">บัญชีธนาคาร</Typography>
							</div>
							<Button
								variant="outlined"
								size="small"
								startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
							>
								เพิ่มบัญชี
							</Button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-20">
							{companyData.bankAccounts.map((account) => (
								<Card
									key={account.id}
									variant="outlined"
									className="rounded-xl"
								>
									<CardContent className="p-20">
										<div className="flex items-center justify-between mb-12">
											<div className="flex items-center gap-8">
												<FuseSvgIcon className="text-blue-500" size={20}>lucide:building</FuseSvgIcon>
												<Typography className="font-bold text-16">
													{account.bank}
												</Typography>
											</div>
											<div className="flex items-center gap-4">
												<Chip
													label={account.type}
													size="small"
													color="primary"
													variant="filled"
												/>
												<Tooltip title="แก้ไข">
													<IconButton size="small" color="primary">
														<FuseSvgIcon size={16}>lucide:pencil</FuseSvgIcon>
													</IconButton>
												</Tooltip>
												<Tooltip title="ลบ">
													<IconButton size="small" color="error">
														<FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>
													</IconButton>
												</Tooltip>
											</div>
										</div>
										<Divider className="mb-12" />
										<div className="grid grid-cols-1 gap-8">
											<div className="flex gap-8">
												<Typography className="text-13 text-gray-500 w-80 shrink-0">สาขา:</Typography>
												<Typography className="text-13 font-medium">{account.branch}</Typography>
											</div>
											<div className="flex gap-8">
												<Typography className="text-13 text-gray-500 w-80 shrink-0">ชื่อบัญชี:</Typography>
												<Typography className="text-13 font-medium">{account.accountName}</Typography>
											</div>
											<div className="flex gap-8">
												<Typography className="text-13 text-gray-500 w-80 shrink-0">เลขที่:</Typography>
												<Typography className="text-14 font-bold text-blue-600">{account.accountNumber}</Typography>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</Paper>

					{/* Snackbar */}
					<Snackbar
						open={saved}
						autoHideDuration={3000}
						onClose={() => setSaved(false)}
						anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
					>
						<Alert severity="success" variant="filled" onClose={() => setSaved(false)}>
							บันทึกข้อมูลบริษัทเรียบร้อยแล้ว
						</Alert>
					</Snackbar>
				</div>
			}
			scroll="content"
		/>
	);
}

export default CompanySettingsPage;
