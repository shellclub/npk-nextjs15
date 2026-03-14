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
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';

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
	return (
		<div className="flex flex-col w-full">
			{/* Header */}
			<div className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 items-center justify-between py-24 px-24 md:px-32">
				<motion.div
					initial={{ x: -20, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
				>
					<Typography className="text-24 md:text-32 font-extrabold tracking-tight">
						ข้อมูลบริษัท
					</Typography>
					<Typography
						className="text-14 font-medium"
						color="text.secondary"
					>
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
					>
						บันทึก
					</Button>
				</motion.div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-24 px-24 md:px-32 pb-32">
				{/* Company Info */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<Paper className="rounded-xl shadow-sm p-24">
						<Typography className="text-16 font-bold mb-16 flex items-center">
							<FuseSvgIcon className="mr-8" size={20}>lucide:building-2</FuseSvgIcon>
							ข้อมูลบริษัท
						</Typography>
						<div className="space-y-16">
							<TextField
								label="ชื่อบริษัท (ภาษาไทย)"
								fullWidth
								defaultValue={companyData.nameTh}
								variant="outlined"
							/>
							<TextField
								label="ชื่อบริษัท (ภาษาอังกฤษ)"
								fullWidth
								defaultValue={companyData.nameEn}
								variant="outlined"
							/>
							<TextField
								label="ที่อยู่ (ภาษาไทย)"
								fullWidth
								multiline
								rows={2}
								defaultValue={companyData.addressTh}
								variant="outlined"
							/>
							<TextField
								label="ที่อยู่ (ภาษาอังกฤษ)"
								fullWidth
								multiline
								rows={2}
								defaultValue={companyData.addressEn}
								variant="outlined"
							/>
							<TextField
								label="เลขผู้เสียภาษี"
								fullWidth
								defaultValue={companyData.taxId}
								variant="outlined"
							/>
						</div>
					</Paper>
				</motion.div>

				{/* Contact Info */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<Paper className="rounded-xl shadow-sm p-24">
						<Typography className="text-16 font-bold mb-16 flex items-center">
							<FuseSvgIcon className="mr-8" size={20}>lucide:phone</FuseSvgIcon>
							ข้อมูลติดต่อ
						</Typography>
						<div className="space-y-16">
							{companyData.phones.map((phone, index) => (
								<TextField
									key={index}
									label={`เบอร์โทร ${index + 1}`}
									fullWidth
									defaultValue={phone}
									variant="outlined"
								/>
							))}
							<TextField
								label="E-mail"
								fullWidth
								defaultValue={companyData.email}
								variant="outlined"
							/>
						</div>
					</Paper>
				</motion.div>

				{/* Bank Accounts */}
				<motion.div
					className="lg:col-span-2"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<Paper className="rounded-xl shadow-sm p-24">
						<div className="flex items-center justify-between mb-16">
							<Typography className="text-16 font-bold flex items-center">
								<FuseSvgIcon className="mr-8" size={20}>lucide:landmark</FuseSvgIcon>
								บัญชีธนาคาร
							</Typography>
							<Button
								variant="outlined"
								size="small"
								startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
							>
								เพิ่มบัญชี
							</Button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-16">
							{companyData.bankAccounts.map((account) => (
								<Card
									key={account.id}
									variant="outlined"
									className="rounded-lg"
								>
									<CardContent>
										<div className="flex items-center justify-between mb-8">
											<Typography className="font-bold text-15">
												{account.bank}
											</Typography>
											<Chip
												label={account.type}
												size="small"
												color="primary"
												variant="outlined"
											/>
										</div>
										<Typography
											className="text-13 mb-4"
											color="text.secondary"
										>
											สาขา: {account.branch}
										</Typography>
										<Typography
											className="text-13 mb-4"
											color="text.secondary"
										>
											ชื่อบัญชี: {account.accountName}
										</Typography>
										<Typography
											className="text-13 font-medium"
											color="primary"
										>
											เลขที่: {account.accountNumber}
										</Typography>
									</CardContent>
								</Card>
							))}
						</div>
					</Paper>
				</motion.div>
			</div>
		</div>
	);
}

export default CompanySettingsPage;
