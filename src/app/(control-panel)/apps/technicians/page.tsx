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
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';

// Mock data for technician teams
const mockTechnicians = [
	{
		id: '1',
		teamName: 'ทีมช่างไฟฟ้า กลุ่ม A',
		leader: {
			name: 'คุณขวัญชัย มั่นคง',
			phone: '092-6492694',
			idCard: '1-7299-00xxx-xx-x',
			address: '123 หมู่ 5 ตำบลสนามชัย อำเภอเมือง สุพรรณบุรี 72000',
		},
		members: [
			{ name: 'สมชาย ใจดี', phone: '089-123-4567', idCard: '1-7299-00xxx-xx-x' },
			{ name: 'วิชัย ศรีสุข', phone: '086-234-5678', idCard: '1-7299-00xxx-xx-x' },
		],
	},
	{
		id: '2',
		teamName: 'ทีมช่างประปา กลุ่ม B',
		leader: {
			name: 'คุณสมศักดิ์ พงษ์ดี',
			phone: '081-345-6789',
			idCard: '1-7299-00xxx-xx-x',
			address: '456 หมู่ 3 ตำบลท่าพี่เลี้ยง อำเภอเมือง สุพรรณบุรี 72000',
		},
		members: [
			{ name: 'ประเสริฐ แสงทอง', phone: '082-456-7890', idCard: '1-7299-00xxx-xx-x' },
			{ name: 'สุชาติ รักษ์ดี', phone: '083-567-8901', idCard: '1-7299-00xxx-xx-x' },
			{ name: 'อนุชา กล้าหาญ', phone: '084-678-9012', idCard: '1-7299-00xxx-xx-x' },
		],
	},
	{
		id: '3',
		teamName: 'ทีมช่างทั่วไป กลุ่ม C',
		leader: {
			name: 'คุณวิเชียร ประสงค์ดี',
			phone: '085-789-0123',
			idCard: '1-7299-00xxx-xx-x',
			address: '789 หมู่ 1 ตำบลสระแก้ว อำเภอเมือง สุพรรณบุรี 72000',
		},
		members: [
			{ name: 'บุญมี สุขใจ', phone: '087-890-1234', idCard: '1-7299-00xxx-xx-x' },
		],
	},
	{
		id: '4',
		teamName: 'ทีมช่างทาสี กลุ่ม D',
		leader: {
			name: 'คุณสำราญ เจริญสุข',
			phone: '088-901-2345',
			idCard: '1-7299-00xxx-xx-x',
			address: '321 หมู่ 7 ตำบลรั้วใหญ่ อำเภอเมือง สุพรรณบุรี 72000',
		},
		members: [
			{ name: 'พิชัย มงคล', phone: '089-012-3456', idCard: '1-7299-00xxx-xx-x' },
			{ name: 'ศักดิ์ชัย ดีมาก', phone: '090-123-4567', idCard: '1-7299-00xxx-xx-x' },
		],
	},
];

function TechniciansPage() {
	const [searchText, setSearchText] = useState('');

	const filteredTeams = mockTechnicians.filter(
		(team) =>
			team.teamName.toLowerCase().includes(searchText.toLowerCase()) ||
			team.leader.name.toLowerCase().includes(searchText.toLowerCase())
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
						ข้อมูลทีมช่าง
					</Typography>
					<Typography
						className="text-14 font-medium"
						color="text.secondary"
					>
						จัดการข้อมูลทีมช่างและสมาชิก
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
							placeholder="ค้นหาทีมช่าง..."
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
							เพิ่มทีมช่าง
						</Button>
					</motion.div>
				</div>
			</div>

			{/* Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-24 px-24 md:px-32 pb-32">
				{filteredTeams.map((team, index) => (
					<motion.div
						key={team.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
					>
						<Paper className="rounded-xl shadow-sm overflow-hidden">
							{/* Team Header */}
							<Box className="bg-blue-600 dark:bg-blue-800 px-20 py-16">
								<div className="flex items-center justify-between">
									<Typography className="text-16 font-bold text-white">
										{team.teamName}
									</Typography>
									<div className="flex space-x-4">
										<IconButton size="small" className="text-white">
											<FuseSvgIcon size={18}>lucide:pencil</FuseSvgIcon>
										</IconButton>
										<IconButton size="small" className="text-white">
											<FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>
										</IconButton>
									</div>
								</div>
							</Box>

							{/* Leader Section */}
							<Box className="px-20 py-16 border-b">
								<Typography
									className="text-12 font-semibold uppercase mb-8"
									color="text.secondary"
								>
									หัวหน้าช่าง
								</Typography>
								<div className="flex items-center space-x-12">
									<Avatar className="bg-amber-600 w-40 h-40">
										{team.leader.name.charAt(0)}
									</Avatar>
									<div>
										<Typography className="font-medium">
											{team.leader.name}
										</Typography>
										<Typography
											className="text-13"
											color="text.secondary"
										>
											📞 {team.leader.phone}
										</Typography>
									</div>
								</div>
							</Box>

							{/* Members Section */}
							<Box className="px-20 py-16">
								<Typography
									className="text-12 font-semibold uppercase mb-8"
									color="text.secondary"
								>
									สมาชิกในทีม ({team.members.length} คน)
								</Typography>
								<div className="space-y-8">
									{team.members.map((member) => (
										<div
											key={member.name}
											className="flex items-center space-x-12"
										>
											<Avatar className="bg-gray-400 w-32 h-32 text-14">
												{member.name.charAt(0)}
											</Avatar>
											<div className="flex-1">
												<Typography className="text-13 font-medium">
													{member.name}
												</Typography>
												<Typography
													className="text-12"
													color="text.secondary"
												>
													{member.phone}
												</Typography>
											</div>
										</div>
									))}
								</div>
							</Box>
						</Paper>
					</motion.div>
				))}
			</div>
		</div>
	);
}

export default TechniciansPage;
