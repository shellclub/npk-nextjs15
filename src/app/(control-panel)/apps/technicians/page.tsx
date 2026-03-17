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
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({
  '& .container': {
    maxWidth: '100%!important',
  },
}));

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
		specialty: 'ไฟฟ้า',
		status: 'active',
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
		specialty: 'ประปา',
		status: 'active',
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
		specialty: 'ทั่วไป',
		status: 'active',
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
		specialty: 'ทาสี',
		status: 'inactive',
	},
];

function TechniciansPage() {
	const [searchText, setSearchText] = useState('');
	const [expandedRow, setExpandedRow] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const filteredTeams = mockTechnicians.filter(
		(team) =>
			team.teamName.toLowerCase().includes(searchText.toLowerCase()) ||
			team.leader.name.toLowerCase().includes(searchText.toLowerCase()) ||
			team.specialty.toLowerCase().includes(searchText.toLowerCase())
	);

	const toggleExpand = (id: string) => {
		setExpandedRow(expandedRow === id ? null : id);
	};

	const getSpecialtyColor = (specialty: string) => {
		switch (specialty) {
			case 'ไฟฟ้า': return 'warning';
			case 'ประปา': return 'info';
			case 'ทาสี': return 'secondary';
			default: return 'default';
		}
	};

	return (
		<Root
			header={
				<div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between py-24 px-24 md:px-32 gap-16">
					<motion.div
						initial={{ x: -20, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
					>
						<Typography className="text-24 md:text-32 font-extrabold tracking-tight leading-none">
							ข้อมูลทีมช่าง
						</Typography>
						<Typography className="text-14 font-medium mt-2" color="text.secondary">
							จัดการข้อมูลทีมช่างและสมาชิก
						</Typography>
					</motion.div>

					<div className="flex flex-col w-full sm:w-auto sm:flex-row items-center gap-12">
						<Paper className="flex items-center w-full sm:w-320 px-16 py-4 rounded-lg border shadow-none">
							<FuseSvgIcon color="disabled" size={20}>lucide:search</FuseSvgIcon>
							<TextField
								placeholder="ค้นหาทีมช่าง..."
								variant="standard"
								fullWidth
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								InputProps={{ disableUnderline: true, className: 'ml-8' }}
							/>
						</Paper>
						<Button
							variant="contained"
							color="secondary"
							startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
							className="whitespace-nowrap"
						>
							เพิ่มทีมช่าง
						</Button>
					</div>
				</div>
			}
			content={
				<div className="w-full px-24 md:px-32 pb-24">
					<Paper className="w-full rounded-xl shadow-sm overflow-hidden">
						<TableContainer>
							<Table size="medium">
								<TableHead>
									<TableRow className="bg-gray-50 dark:bg-gray-900">
										<TableCell className="font-bold text-13 w-48"></TableCell>
										<TableCell className="font-bold text-13 w-48">#</TableCell>
										<TableCell className="font-bold text-13">ชื่อทีม</TableCell>
										<TableCell className="font-bold text-13">ความเชี่ยวชาญ</TableCell>
										<TableCell className="font-bold text-13">หัวหน้าช่าง</TableCell>
										<TableCell className="font-bold text-13">เบอร์โทรหัวหน้า</TableCell>
										<TableCell className="font-bold text-13">จำนวนสมาชิก</TableCell>
										<TableCell className="font-bold text-13">สถานะ</TableCell>
										<TableCell className="font-bold text-13 text-center w-100">จัดการ</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{filteredTeams
										.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
										.map((team, index) => (
										<>
											<TableRow
												key={team.id}
												hover
												className="cursor-pointer"
												onClick={() => toggleExpand(team.id)}
											>
												<TableCell>
													<IconButton size="small">
														<FuseSvgIcon size={16}>
															{expandedRow === team.id ? 'lucide:chevron-down' : 'lucide:chevron-right'}
														</FuseSvgIcon>
													</IconButton>
												</TableCell>
												<TableCell className="text-13">{page * rowsPerPage + index + 1}</TableCell>
												<TableCell>
													<Typography className="font-semibold text-14">
														{team.teamName}
													</Typography>
												</TableCell>
												<TableCell>
													<Chip
														label={team.specialty}
														size="small"
														color={getSpecialtyColor(team.specialty) as any}
														variant="filled"
														className="text-12"
													/>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-8">
														<Avatar className="bg-blue-600 w-32 h-32 text-13">
															{team.leader.name.replace('คุณ', '').charAt(0)}
														</Avatar>
														<Typography className="text-13 font-medium">
															{team.leader.name}
														</Typography>
													</div>
												</TableCell>
												<TableCell className="text-13 whitespace-nowrap">{team.leader.phone}</TableCell>
												<TableCell>
													<Chip
														label={`${team.members.length + 1} คน`}
														size="small"
														variant="outlined"
														className="text-12"
													/>
												</TableCell>
												<TableCell>
													<Chip
														label={team.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
														size="small"
														color={team.status === 'active' ? 'success' : 'default'}
														variant="filled"
														className="text-12"
													/>
												</TableCell>
												<TableCell>
													<Box className="flex items-center justify-center gap-4">
														<Tooltip title="แก้ไข">
															<IconButton size="small" color="primary" onClick={(e) => e.stopPropagation()}>
																<FuseSvgIcon size={18}>lucide:pencil</FuseSvgIcon>
															</IconButton>
														</Tooltip>
														<Tooltip title="ลบ">
															<IconButton size="small" color="error" onClick={(e) => e.stopPropagation()}>
																<FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>
															</IconButton>
														</Tooltip>
													</Box>
												</TableCell>
											</TableRow>
											{/* Expanded Members */}
											<TableRow key={`${team.id}-expand`}>
												<TableCell colSpan={9} className="p-0 border-0">
													<Collapse in={expandedRow === team.id} timeout="auto" unmountOnExit>
														<Box className="bg-gray-50 dark:bg-gray-900/50 px-48 py-16">
															<div className="grid grid-cols-1 md:grid-cols-2 gap-16">
																<div>
																	<Typography className="text-12 font-bold uppercase mb-8 text-gray-500">
																		ข้อมูลหัวหน้าช่าง
																	</Typography>
																	<div className="space-y-4">
																		<Typography className="text-13">
																			📍 {team.leader.address}
																		</Typography>
																		<Typography className="text-13">
																			🪪 {team.leader.idCard}
																		</Typography>
																	</div>
																</div>
																<div>
																	<Typography className="text-12 font-bold uppercase mb-8 text-gray-500">
																		สมาชิกในทีม ({team.members.length} คน)
																	</Typography>
																	<div className="space-y-8">
																		{team.members.map((member) => (
																			<div key={member.name} className="flex items-center gap-8">
																				<Avatar className="bg-gray-400 w-28 h-28 text-12">
																					{member.name.charAt(0)}
																				</Avatar>
																				<div>
																					<Typography className="text-13 font-medium">{member.name}</Typography>
																					<Typography className="text-12" color="text.secondary">
																						📞 {member.phone} | 🪪 {member.idCard}
																					</Typography>
																				</div>
																			</div>
																		))}
																	</div>
																</div>
															</div>
														</Box>
													</Collapse>
												</TableCell>
											</TableRow>
										</>
									))}
									{filteredTeams.length === 0 && (
										<TableRow>
											<TableCell colSpan={9} className="text-center py-48">
												<FuseSvgIcon className="text-gray-400 mb-8" size={48}>lucide:hard-hat</FuseSvgIcon>
												<Typography color="text.secondary">ไม่พบข้อมูลทีมช่าง</Typography>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</TableContainer>
						<TablePagination
							component="div"
							count={filteredTeams.length}
							rowsPerPage={rowsPerPage}
							page={page}
							onPageChange={(_, p) => setPage(p)}
							onRowsPerPageChange={(e) => {
								setRowsPerPage(parseInt(e.target.value, 10));
								setPage(0);
							}}
							rowsPerPageOptions={[5, 10, 25]}
							labelRowsPerPage="แสดง"
							labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
						/>
					</Paper>
				</div>
			}
			scroll="content"
		/>
	);
}

export default TechniciansPage;
