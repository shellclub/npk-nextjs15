'use client';

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';

// Mock data for customers
const mockCustomers = [
	{
		id: '1',
		groupName: 'บริษัท ศุภมิตร จำกัด',
		headOfficeAddress: '1468 ถนนพัฒนาการ แขวงพัฒนาการ เขตสวนหลวง กรุงเทพฯ 10250',
		taxId: '0105528152401',
		branches: [
			{ code: 'store036', name: 'Lotuss 10089 H0539:Rayong A5' },
			{ code: 'store037', name: 'Lotuss 10090 H0540:Chonburi A3' },
		],
		contactName: 'Somchat Jeamsakul',
		phone: '098-9429891',
		email: 'somchat@suphamit.co.th',
	},
	{
		id: '2',
		groupName: 'บริษัท เซ็นทรัลพัฒนา จำกัด (มหาชน)',
		headOfficeAddress: '999/9 ถนนพระราม1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
		taxId: '0107536000269',
		branches: [
			{ code: 'CPN001', name: 'Central World' },
			{ code: 'CPN002', name: 'Central Ladprao' },
			{ code: 'CPN003', name: 'Central Westgate' },
		],
		contactName: 'สมศรี จันทร์เพ็ญ',
		phone: '02-021-9999',
		email: 'somsri@centralpattana.co.th',
	},
	{
		id: '3',
		groupName: 'บริษัท โฮมโปร เซ็นเตอร์ จำกัด (มหาชน)',
		headOfficeAddress: '31 ซอยพัฒนาการ 20 แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ 10250',
		taxId: '0107537001528',
		branches: [
			{ code: 'HP001', name: 'HomePro ราชพฤกษ์' },
			{ code: 'HP002', name: 'HomePro รังสิต' },
		],
		contactName: 'วิชัย เจริญสุข',
		phone: '02-331-8000',
		email: 'wichai@homepro.co.th',
	},
	{
		id: '4',
		groupName: 'บริษัท สยามพิวรรธน์ จำกัด',
		headOfficeAddress: '989 ถนนพระราม1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
		taxId: '0105525058291',
		branches: [
			{ code: 'SP001', name: 'Siam Paragon' },
		],
		contactName: 'นิภา สุวรรณ',
		phone: '02-610-8000',
		email: 'nipa@siampiwat.com',
	},
	{
		id: '5',
		groupName: 'โรงพยาบาลศุภมิตร',
		headOfficeAddress: '761 ถนนประชาธิปไตย อำเภอเมือง จังหวัดสุพรรณบุรี 72000',
		taxId: '0725534000161',
		branches: [
			{ code: 'SUPH01', name: 'สาขาหลัก สุพรรณบุรี' },
		],
		contactName: 'ดร.สมชาย วิโรจน์',
		phone: '035-523-444',
		email: 'admin@suphamit-hospital.co.th',
	},
];

function CustomersPage() {
	const [searchText, setSearchText] = useState('');

	const filteredCustomers = mockCustomers.filter(
		(customer) =>
			customer.groupName.toLowerCase().includes(searchText.toLowerCase()) ||
			customer.contactName.toLowerCase().includes(searchText.toLowerCase()) ||
			customer.phone.includes(searchText)
	);

	return (
		<div className="flex flex-col w-full">
			{/* Header */}
			<div className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 items-center justify-between py-24 px-24 md:px-32">
				<motion.div
					initial={{ x: -20, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
				>
					<Typography className="text-24 md:text-32 font-extrabold tracking-tight">
						ข้อมูลลูกค้า
					</Typography>
					<Typography
						className="text-14 font-medium"
						color="text.secondary"
					>
						จัดการข้อมูลลูกค้าและสาขา
					</Typography>
				</motion.div>

				<div className="flex flex-col w-full sm:w-auto sm:flex-row space-y-16 sm:space-y-0 flex-1 items-center justify-end space-x-8">
					<Paper className="flex items-center w-full sm:max-w-256 space-x-8 px-16 rounded-full border-1 shadow-0">
						<FuseSvgIcon
							color="disabled"
							size={20}
						>
							lucide:search
						</FuseSvgIcon>
						<TextField
							placeholder="ค้นหาลูกค้า..."
							variant="standard"
							fullWidth
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							InputProps={{
								disableUnderline: true,
							}}
						/>
					</Paper>
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
					>
						<Button
							variant="contained"
							color="secondary"
							startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
						>
							เพิ่มลูกค้า
						</Button>
					</motion.div>
				</div>
			</div>

			{/* Table */}
			<Paper className="mx-24 md:mx-32 rounded-xl shadow-sm overflow-hidden">
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell className="font-semibold">#</TableCell>
								<TableCell className="font-semibold">กลุ่มลูกค้า</TableCell>
								<TableCell className="font-semibold">สำนักงานใหญ่</TableCell>
								<TableCell className="font-semibold">สาขา</TableCell>
								<TableCell className="font-semibold">ชื่อผู้ติดต่อ</TableCell>
								<TableCell className="font-semibold">เบอร์โทร</TableCell>
								<TableCell className="font-semibold text-center">จัดการ</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredCustomers.map((customer, index) => (
								<TableRow
									key={customer.id}
									hover
									className="cursor-pointer"
								>
									<TableCell>{index + 1}</TableCell>
									<TableCell>
										<Typography className="font-medium">
											{customer.groupName}
										</Typography>
										<Typography
											className="text-12"
											color="text.secondary"
										>
											เลขผู้เสียภาษี: {customer.taxId}
										</Typography>
									</TableCell>
									<TableCell>
										<Typography className="text-13 max-w-256 truncate">
											{customer.headOfficeAddress}
										</Typography>
									</TableCell>
									<TableCell>
										<Box className="flex flex-wrap gap-4">
											{customer.branches.map((branch) => (
												<Chip
													key={branch.code}
													label={`${branch.code}: ${branch.name}`}
													size="small"
													variant="outlined"
													color="primary"
												/>
											))}
										</Box>
									</TableCell>
									<TableCell>{customer.contactName}</TableCell>
									<TableCell>{customer.phone}</TableCell>
									<TableCell>
										<Box className="flex items-center justify-center space-x-4">
											<IconButton
												size="small"
												color="primary"
											>
												<FuseSvgIcon size={18}>lucide:pencil</FuseSvgIcon>
											</IconButton>
											<IconButton
												size="small"
												color="error"
											>
												<FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>
											</IconButton>
										</Box>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>
		</div>
	);
}

export default CustomersPage;
