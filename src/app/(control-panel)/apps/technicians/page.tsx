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
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({
  '& .container': {
    maxWidth: '100%!important',
  },
}));

type Member = { name: string; phone: string; idCard: string };

type TechTeam = {
	id: string;
	teamName: string;
	specialty: string;
	leader: { name: string; phone: string; idCard: string; address: string };
	members: Member[];
	isActive: boolean;
};

const specialtyOptions = ['ไฟฟ้า', 'ประปา', 'ทาสี', 'แอร์', 'ทั่วไป'];

const initialTeams: TechTeam[] = [
	{
		id: '1',
		teamName: 'ทีมช่างไฟฟ้า กลุ่ม A',
		specialty: 'ไฟฟ้า',
		leader: { name: 'คุณขวัญชัย มั่นคง', phone: '092-6492694', idCard: '1-7299-00xxx-xx-x', address: '123 หมู่ 5 ตำบลสนามชัย อำเภอเมือง สุพรรณบุรี 72000' },
		members: [
			{ name: 'สมชาย ใจดี', phone: '089-123-4567', idCard: '1-7299-00xxx-xx-x' },
			{ name: 'วิชัย ศรีสุข', phone: '086-234-5678', idCard: '1-7299-00xxx-xx-x' },
		],
		isActive: true,
	},
	{
		id: '2',
		teamName: 'ทีมช่างประปา กลุ่ม B',
		specialty: 'ประปา',
		leader: { name: 'คุณสมศักดิ์ พงษ์ดี', phone: '081-345-6789', idCard: '1-7299-00xxx-xx-x', address: '456 หมู่ 3 ตำบลท่าพี่เลี้ยง อำเภอเมือง สุพรรณบุรี 72000' },
		members: [
			{ name: 'ประเสริฐ แสงทอง', phone: '082-456-7890', idCard: '1-7299-00xxx-xx-x' },
			{ name: 'สุชาติ รักษ์ดี', phone: '083-567-8901', idCard: '1-7299-00xxx-xx-x' },
			{ name: 'อนุชา กล้าหาญ', phone: '084-678-9012', idCard: '1-7299-00xxx-xx-x' },
		],
		isActive: true,
	},
	{
		id: '3',
		teamName: 'ทีมช่างทั่วไป กลุ่ม C',
		specialty: 'ทั่วไป',
		leader: { name: 'คุณวิเชียร ประสงค์ดี', phone: '085-789-0123', idCard: '1-7299-00xxx-xx-x', address: '789 หมู่ 1 ตำบลสระแก้ว อำเภอเมือง สุพรรณบุรี 72000' },
		members: [
			{ name: 'บุญมี สุขใจ', phone: '087-890-1234', idCard: '1-7299-00xxx-xx-x' },
		],
		isActive: true,
	},
	{
		id: '4',
		teamName: 'ทีมช่างทาสี กลุ่ม D',
		specialty: 'ทาสี',
		leader: { name: 'คุณสำราญ เจริญสุข', phone: '088-901-2345', idCard: '1-7299-00xxx-xx-x', address: '321 หมู่ 7 ตำบลรั้วใหญ่ อำเภอเมือง สุพรรณบุรี 72000' },
		members: [
			{ name: 'พิชัย มงคล', phone: '089-012-3456', idCard: '1-7299-00xxx-xx-x' },
			{ name: 'ศักดิ์ชัย ดีมาก', phone: '090-123-4567', idCard: '1-7299-00xxx-xx-x' },
		],
		isActive: true,
	},
	{
		id: '5',
		teamName: 'ทีมช่างแอร์ กลุ่ม E',
		specialty: 'แอร์',
		leader: { name: 'คุณประยุทธ์ เย็นใจ', phone: '091-234-5678', idCard: '1-7299-00xxx-xx-x', address: '555 หมู่ 2 ตำบลโพธิ์พระยา อำเภอเมือง สุพรรณบุรี 72000' },
		members: [
			{ name: 'ธีระ ปิ่นทอง', phone: '092-345-6789', idCard: '1-7299-00xxx-xx-x' },
			{ name: 'วรพล ชัยมงคล', phone: '093-456-7890', idCard: '1-7299-00xxx-xx-x' },
			{ name: 'สุทิน แก้วศรี', phone: '094-567-8901', idCard: '1-7299-00xxx-xx-x' },
		],
		isActive: true,
	},
	{
		id: '6',
		teamName: 'ทีมช่างไฟฟ้า กลุ่ม F',
		specialty: 'ไฟฟ้า',
		leader: { name: 'คุณณรงค์ ทองดี', phone: '095-678-9012', idCard: '1-7299-00xxx-xx-x', address: '88 หมู่ 9 ตำบลดอนเจดีย์ อำเภอดอนเจดีย์ สุพรรณบุรี 72170' },
		members: [
			{ name: 'สุนทร มีโชค', phone: '096-789-0123', idCard: '1-7299-00xxx-xx-x' },
		],
		isActive: false,
	},
];

const emptyTeamForm = {
	teamName: '',
	specialty: 'ทั่วไป',
	leaderName: '',
	leaderPhone: '',
	leaderIdCard: '',
	leaderAddress: '',
};

type TeamForm = typeof emptyTeamForm;

const specialtyColors: Record<string, { bg: string; text: string; border: string }> = {
	'ไฟฟ้า': { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
	'ประปา': { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' },
	'ทาสี': { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
	'แอร์': { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' },
	'ทั่วไป': { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
};

function TechniciansPage() {
	const [teams, setTeams] = useState<TechTeam[]>(initialTeams);
	const [searchText, setSearchText] = useState('');
	const [showInactive, setShowInactive] = useState(false);
	const [expandedRow, setExpandedRow] = useState<string | null>(null);

	// Team form dialog
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<TeamForm>(emptyTeamForm);
	const [formErrors, setFormErrors] = useState<Partial<Record<keyof TeamForm, string>>>({});

	// Member management dialog
	const [memberDialogOpen, setMemberDialogOpen] = useState(false);
	const [managingTeamId, setManagingTeamId] = useState<string | null>(null);
	const [newMemberName, setNewMemberName] = useState('');
	const [newMemberPhone, setNewMemberPhone] = useState('');
	const [newMemberIdCard, setNewMemberIdCard] = useState('');

	// Disable dialog
	const [disableDialogOpen, setDisableDialogOpen] = useState(false);
	const [disableTarget, setDisableTarget] = useState<TechTeam | null>(null);

	// Snackbar
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

	// Filter
	const filteredTeams = teams.filter((t) => {
		const matchSearch =
			t.teamName.toLowerCase().includes(searchText.toLowerCase()) ||
			t.leader.name.toLowerCase().includes(searchText.toLowerCase()) ||
			t.specialty.includes(searchText);
		const matchActive = showInactive ? true : t.isActive;
		return matchSearch && matchActive;
	});

	const toggleExpand = (id: string) => {
		setExpandedRow(expandedRow === id ? null : id);
	};

	// Validation
	const validateForm = (): boolean => {
		const errors: Partial<Record<keyof TeamForm, string>> = {};
		if (!form.teamName.trim()) errors.teamName = 'กรุณาระบุชื่อทีม';
		if (!form.leaderName.trim()) errors.leaderName = 'กรุณาระบุชื่อหัวหน้าช่าง';
		if (!form.leaderPhone.trim()) errors.leaderPhone = 'กรุณาระบุเบอร์โทร';
		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// Create
	const handleCreate = () => {
		setForm(emptyTeamForm);
		setFormErrors({});
		setDialogMode('create');
		setEditingId(null);
		setDialogOpen(true);
	};

	// Edit
	const handleEdit = (team: TechTeam) => {
		setForm({
			teamName: team.teamName,
			specialty: team.specialty,
			leaderName: team.leader.name,
			leaderPhone: team.leader.phone,
			leaderIdCard: team.leader.idCard,
			leaderAddress: team.leader.address,
		});
		setFormErrors({});
		setDialogMode('edit');
		setEditingId(team.id);
		setDialogOpen(true);
	};

	// Save
	const handleSave = () => {
		if (!validateForm()) return;
		if (dialogMode === 'create') {
			const newTeam: TechTeam = {
				id: String(Date.now()),
				teamName: form.teamName,
				specialty: form.specialty,
				leader: { name: form.leaderName, phone: form.leaderPhone, idCard: form.leaderIdCard, address: form.leaderAddress },
				members: [],
				isActive: true,
			};
			setTeams((prev) => [...prev, newTeam]);
			setSnackbar({ open: true, message: `เพิ่มทีม "${form.teamName}" เรียบร้อยแล้ว`, severity: 'success' });
		} else if (editingId) {
			setTeams((prev) =>
				prev.map((t) =>
					t.id === editingId
						? { ...t, teamName: form.teamName, specialty: form.specialty,
							  leader: { name: form.leaderName, phone: form.leaderPhone, idCard: form.leaderIdCard, address: form.leaderAddress } }
						: t
				)
			);
			setSnackbar({ open: true, message: `แก้ไขทีม "${form.teamName}" เรียบร้อยแล้ว`, severity: 'success' });
		}
		setDialogOpen(false);
	};

	// Disable / Enable
	const handleDisableClick = (team: TechTeam) => {
		setDisableTarget(team);
		setDisableDialogOpen(true);
	};

	const handleDisableConfirm = () => {
		if (!disableTarget) return;
		const newStatus = !disableTarget.isActive;
		setTeams((prev) => prev.map((t) => t.id === disableTarget.id ? { ...t, isActive: newStatus } : t));
		setSnackbar({
			open: true,
			message: newStatus ? `เปิดใช้งาน "${disableTarget.teamName}" เรียบร้อยแล้ว` : `ปิดใช้งาน "${disableTarget.teamName}" เรียบร้อยแล้ว`,
			severity: newStatus ? 'success' : 'info',
		});
		setDisableDialogOpen(false);
		setDisableTarget(null);
	};

	// Member management
	const handleManageMembers = (team: TechTeam) => {
		setManagingTeamId(team.id);
		setNewMemberName('');
		setNewMemberPhone('');
		setNewMemberIdCard('');
		setMemberDialogOpen(true);
	};

	const handleAddMember = () => {
		if (!newMemberName.trim() || !newMemberPhone.trim() || !managingTeamId) return;
		setTeams((prev) =>
			prev.map((t) =>
				t.id === managingTeamId
					? { ...t, members: [...t.members, { name: newMemberName.trim(), phone: newMemberPhone.trim(), idCard: newMemberIdCard.trim() }] }
					: t
			)
		);
		setNewMemberName('');
		setNewMemberPhone('');
		setNewMemberIdCard('');
		setSnackbar({ open: true, message: 'เพิ่มสมาชิกเรียบร้อยแล้ว', severity: 'success' });
	};

	const handleRemoveMember = (memberName: string) => {
		if (!managingTeamId) return;
		setTeams((prev) =>
			prev.map((t) =>
				t.id === managingTeamId
					? { ...t, members: t.members.filter((m) => m.name !== memberName) }
					: t
			)
		);
	};

	const managingTeam = teams.find((t) => t.id === managingTeamId);

	const handleFieldChange = (field: keyof TeamForm, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
	};

	const header = (
		<div className="flex flex-auto flex-col py-4">
			<Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
				ข้อมูลหลัก {'>'} ข้อมูลทีมช่าง
			</Typography>
			<div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
				<div className="flex flex-auto items-center gap-8">
					<motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
						<Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
							ข้อมูลทีมช่าง
						</Typography>
					</motion.span>
					<div className="flex flex-1 items-center justify-end gap-12">
						<FormControlLabel
							control={<Switch size="small" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />}
							label={<Typography sx={{ fontSize: '13px', color: '#64748B' }}>แสดงที่ปิดใช้งาน</Typography>}
						/>
						<TextField placeholder="ค้นหาจากชื่อทีม, ชื่อหัวหน้า, ความเชี่ยวชาญ..." value={searchText}
							onChange={(e) => setSearchText(e.target.value)} size="small"
							sx={{ minWidth: 340, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '15px', bgcolor: '#F8FAFC' } }}
							InputProps={{
								startAdornment: <InputAdornment position="start"><FuseSvgIcon size={20} color="action">lucide:search</FuseSvgIcon></InputAdornment>,
								endAdornment: searchText ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchText('')}><FuseSvgIcon size={16}>lucide:x</FuseSvgIcon></IconButton></InputAdornment> : null,
							}} />
						<motion.div className="flex grow-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
							<Button variant="contained" size="large" onClick={handleCreate}
								startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
								sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '15px', px: 3, py: 1, bgcolor: '#0EA5E9', '&:hover': { bgcolor: '#0284C7' } }}>
								เพิ่มทีมช่าง
							</Button>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);

	const content = (
		<Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
			{filteredTeams.length === 0 ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
					<FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:hard-hat</FuseSvgIcon>
					<Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ไม่พบข้อมูลทีมช่าง</Typography>
					<Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>กดปุ่ม "เพิ่มทีมช่าง" เพื่อเริ่มเพิ่มข้อมูล</Typography>
				</Box>
			) : (
				<TableContainer sx={{ flex: 1 }}>
					<Table stickyHeader>
						<TableHead>
							<TableRow sx={{
								'& th': { fontSize: '14px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC', whiteSpace: 'nowrap' },
							}}>
								<TableCell sx={{ width: 40 }}></TableCell>
								<TableCell align="center" sx={{ width: 50 }}>#</TableCell>
								<TableCell>ชื่อทีม</TableCell>
								<TableCell>ความเชี่ยวชาญ</TableCell>
								<TableCell>หัวหน้าช่าง</TableCell>
								<TableCell>เบอร์โทรหัวหน้า</TableCell>
								<TableCell align="center">สมาชิก</TableCell>
								<TableCell align="center">สถานะ</TableCell>
								<TableCell align="center" sx={{ width: 140 }}>จัดการ</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredTeams.map((team, index) => {
								const isInactive = !team.isActive;
								const sc = specialtyColors[team.specialty] || specialtyColors['ทั่วไป'];
								return (
									<>
										<TableRow key={team.id} hover onClick={() => toggleExpand(team.id)}
											sx={{
												cursor: 'pointer', '&:hover': { bgcolor: '#F0F9FF' },
												opacity: isInactive ? 0.5 : 1,
												'& td': { fontSize: '14px', color: isInactive ? '#9CA3AF' : '#334155', py: 1.2, borderBottom: '1px solid #F1F5F9' },
											}}>
											<TableCell sx={{ pr: 0 }}>
												<IconButton size="small">
													<FuseSvgIcon size={16} sx={{ transition: 'transform 0.2s', transform: expandedRow === team.id ? 'rotate(90deg)' : 'none' }}>
														lucide:chevron-right
													</FuseSvgIcon>
												</IconButton>
											</TableCell>
											<TableCell align="center" sx={{ fontWeight: 500, color: '#94A3B8 !important' }}>{index + 1}</TableCell>
											<TableCell>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography sx={{ fontSize: '14px', fontWeight: 600, color: isInactive ? '#9CA3AF' : '#0284C7', textDecoration: isInactive ? 'line-through' : 'none' }}>
														{team.teamName}
													</Typography>
													{isInactive && <Chip label="ปิดใช้งาน" size="small" sx={{ fontSize: '11px', height: 20, bgcolor: '#FEE2E2', color: '#DC2626' }} />}
												</Box>
											</TableCell>
											<TableCell>
												<Chip label={team.specialty} size="small"
													sx={{ fontSize: '12px', fontWeight: 600, height: 26, bgcolor: isInactive ? '#F3F4F6' : sc.bg, color: isInactive ? '#9CA3AF' : sc.text, border: `1px solid ${isInactive ? '#E5E7EB' : sc.border}` }} />
											</TableCell>
											<TableCell>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Avatar sx={{ bgcolor: isInactive ? '#D1D5DB' : '#0EA5E9', width: 32, height: 32, fontSize: '13px' }}>
														{team.leader.name.replace('คุณ', '').charAt(0)}
													</Avatar>
													<Typography sx={{ fontSize: '14px', fontWeight: 500 }}>{team.leader.name}</Typography>
												</Box>
											</TableCell>
											<TableCell>
												<Typography sx={{ fontSize: '14px', color: '#64748B' }}>{team.leader.phone}</Typography>
											</TableCell>
											<TableCell align="center">
												<Chip label={`${team.members.length + 1} คน`} size="small"
													sx={{ fontSize: '12px', fontWeight: 600, bgcolor: '#E0F2FE', color: '#0284C7', border: '1px solid #BAE6FD' }} />
											</TableCell>
											<TableCell align="center">
												<Chip label={team.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'} size="small"
													sx={{
														fontSize: '12px', fontWeight: 600, height: 24,
														bgcolor: team.isActive ? '#D1FAE5' : '#FEE2E2',
														color: team.isActive ? '#059669' : '#DC2626',
													}} />
											</TableCell>
											<TableCell align="center">
												<Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
													<Tooltip title="แก้ไข" arrow>
														<IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(team); }}
															sx={{ color: '#0EA5E9', '&:hover': { bgcolor: '#E0F2FE' } }}>
															<FuseSvgIcon size={18}>lucide:pencil</FuseSvgIcon>
														</IconButton>
													</Tooltip>
													<Tooltip title="จัดการสมาชิก" arrow>
														<IconButton size="small" onClick={(e) => { e.stopPropagation(); handleManageMembers(team); }}
															sx={{ color: '#8B5CF6', '&:hover': { bgcolor: '#EDE9FE' } }}>
															<FuseSvgIcon size={18}>lucide:users</FuseSvgIcon>
														</IconButton>
													</Tooltip>
													<Tooltip title={team.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} arrow>
														<IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDisableClick(team); }}
															sx={{ color: team.isActive ? '#EF4444' : '#22C55E', '&:hover': { bgcolor: team.isActive ? '#FEE2E2' : '#DCFCE7' } }}>
															<FuseSvgIcon size={18}>{team.isActive ? 'lucide:ban' : 'lucide:check-circle'}</FuseSvgIcon>
														</IconButton>
													</Tooltip>
												</Box>
											</TableCell>
										</TableRow>
										{/* Expanded Detail */}
										<TableRow key={`${team.id}-detail`}>
											<TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
												<Collapse in={expandedRow === team.id} timeout="auto" unmountOnExit>
													<Box sx={{ bgcolor: '#F8FAFC', px: 6, py: 2.5, borderBottom: '1px solid #E2E8F0' }}>
														<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
															<Box>
																<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', mb: 1, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
																	ข้อมูลหัวหน้าช่าง
																</Typography>
																<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
																	<Typography sx={{ fontSize: '13px', color: '#475569' }}>📍 {team.leader.address}</Typography>
																	<Typography sx={{ fontSize: '13px', color: '#475569' }}>🪪 {team.leader.idCard}</Typography>
																</Box>
															</Box>
															<Box>
																<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', mb: 1, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
																	สมาชิกในทีม ({team.members.length} คน)
																</Typography>
																{team.members.length > 0 ? (
																	<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
																		{team.members.map((m) => (
																			<Box key={m.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
																				<Avatar sx={{ bgcolor: '#94A3B8', width: 28, height: 28, fontSize: '12px' }}>{m.name.charAt(0)}</Avatar>
																				<Box>
																					<Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{m.name}</Typography>
																					<Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>📞 {m.phone} | 🪪 {m.idCard}</Typography>
																				</Box>
																			</Box>
																		))}
																	</Box>
																) : (
																	<Typography sx={{ fontSize: '13px', color: '#CBD5E1' }}>ยังไม่มีสมาชิก</Typography>
																)}
															</Box>
														</Box>
													</Box>
												</Collapse>
											</TableCell>
										</TableRow>
									</>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* ========== Create/Edit Team Dialog ========== */}
			<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
				<DialogTitle sx={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
					<FuseSvgIcon sx={{ color: '#0EA5E9' }} size={24}>{dialogMode === 'create' ? 'lucide:hard-hat' : 'lucide:settings'}</FuseSvgIcon>
					{dialogMode === 'create' ? 'เพิ่มทีมช่างใหม่' : 'แก้ไขข้อมูลทีมช่าง'}
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 3 }}>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
						<Box sx={{ gridColumn: { md: 'span 2' } }}>
							<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0EA5E9', mb: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
								ข้อมูลทีม
							</Typography>
						</Box>
						<TextField label="ชื่อทีม *" fullWidth value={form.teamName}
							onChange={(e) => handleFieldChange('teamName', e.target.value)}
							error={!!formErrors.teamName} helperText={formErrors.teamName}
							placeholder="เช่น ทีมช่างไฟฟ้า กลุ่ม A"
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
						<TextField label="ความเชี่ยวชาญ" fullWidth select value={form.specialty}
							onChange={(e) => handleFieldChange('specialty', e.target.value)}
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
							{specialtyOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
						</TextField>

						<Box sx={{ gridColumn: { md: 'span 2' }, mt: 1 }}>
							<Divider sx={{ mb: 2 }} />
							<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0EA5E9', mb: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
								ข้อมูลหัวหน้าช่าง
							</Typography>
						</Box>
						<TextField label="ชื่อหัวหน้าช่าง *" fullWidth value={form.leaderName}
							onChange={(e) => handleFieldChange('leaderName', e.target.value)}
							error={!!formErrors.leaderName} helperText={formErrors.leaderName}
							placeholder="เช่น คุณสมชาย ใจดี"
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
						<TextField label="เบอร์โทร *" fullWidth value={form.leaderPhone}
							onChange={(e) => handleFieldChange('leaderPhone', e.target.value)}
							error={!!formErrors.leaderPhone} helperText={formErrors.leaderPhone}
							placeholder="เช่น 081-234-5678"
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
						<TextField label="เลขบัตรประชาชน" fullWidth value={form.leaderIdCard}
							onChange={(e) => handleFieldChange('leaderIdCard', e.target.value)}
							placeholder="เช่น 1-7299-00xxx-xx-x"
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
						<Box /> {/* Spacer */}
						<TextField label="ที่อยู่" fullWidth multiline rows={3} value={form.leaderAddress}
							onChange={(e) => handleFieldChange('leaderAddress', e.target.value)}
							placeholder="เช่น 123 หมู่ 5 ตำบลสนามชัย อำเภอเมือง สุพรรณบุรี 72000"
							sx={{ gridColumn: { md: 'span 2' }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
					</Box>
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
					<Button onClick={() => setDialogOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '15px', px: 3, color: '#64748B', borderColor: '#E2E8F0' }}>
						ยกเลิก
					</Button>
					<Button onClick={handleSave} variant="contained"
						startIcon={<FuseSvgIcon size={18}>{dialogMode === 'create' ? 'lucide:plus' : 'lucide:save'}</FuseSvgIcon>}
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '15px', px: 3, bgcolor: '#0EA5E9', '&:hover': { bgcolor: '#0284C7' } }}>
						{dialogMode === 'create' ? 'เพิ่มทีมช่าง' : 'บันทึกการแก้ไข'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* ========== Member Management Dialog ========== */}
			<Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
				<DialogTitle sx={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
					<FuseSvgIcon sx={{ color: '#8B5CF6' }} size={24}>lucide:users</FuseSvgIcon>
					จัดการสมาชิกในทีม
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 3 }}>
					{managingTeam && (
						<>
							<Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#475569', mb: 2 }}>
								{managingTeam.teamName}
							</Typography>

							{/* Leader info */}
							<Box sx={{ p: 1.5, bgcolor: '#E0F2FE', borderRadius: '8px', border: '1px solid #BAE6FD', mb: 2 }}>
								<Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#0284C7', mb: 0.5, textTransform: 'uppercase' }}>หัวหน้าช่าง</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<Avatar sx={{ bgcolor: '#0EA5E9', width: 32, height: 32, fontSize: '13px' }}>{managingTeam.leader.name.replace('คุณ', '').charAt(0)}</Avatar>
									<Box>
										<Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{managingTeam.leader.name}</Typography>
										<Typography sx={{ fontSize: '12px', color: '#0284C7' }}>📞 {managingTeam.leader.phone}</Typography>
									</Box>
								</Box>
							</Box>

							{/* Existing members */}
							<Box sx={{ mb: 3 }}>
								<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', mb: 1, textTransform: 'uppercase' }}>
									สมาชิก ({managingTeam.members.length} คน)
								</Typography>
								{managingTeam.members.length > 0 ? (
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
										{managingTeam.members.map((member) => (
											<Box key={member.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Avatar sx={{ bgcolor: '#94A3B8', width: 28, height: 28, fontSize: '12px' }}>{member.name.charAt(0)}</Avatar>
													<Box>
														<Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{member.name}</Typography>
														<Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>📞 {member.phone} | 🪪 {member.idCard}</Typography>
													</Box>
												</Box>
												<Tooltip title="ลบสมาชิก" arrow>
													<IconButton size="small" onClick={() => handleRemoveMember(member.name)}
														sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}>
														<FuseSvgIcon size={16}>lucide:x</FuseSvgIcon>
													</IconButton>
												</Tooltip>
											</Box>
										))}
									</Box>
								) : (
									<Typography sx={{ fontSize: '14px', color: '#94A3B8', textAlign: 'center', py: 3 }}>ยังไม่มีสมาชิก</Typography>
								)}
							</Box>

							{/* Add new member */}
							<Divider sx={{ mb: 2 }} />
							<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#8B5CF6', mb: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
								เพิ่มสมาชิกใหม่
							</Typography>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
								<Box sx={{ display: 'flex', gap: 1.5 }}>
									<TextField label="ชื่อ-สกุล" size="small" fullWidth value={newMemberName}
										onChange={(e) => setNewMemberName(e.target.value)} placeholder="เช่น สมชาย ใจดี"
										sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
									<TextField label="เบอร์โทร" size="small" value={newMemberPhone}
										onChange={(e) => setNewMemberPhone(e.target.value)} placeholder="081-xxx-xxxx"
										sx={{ width: 180, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
								</Box>
								<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
									<TextField label="เลขบัตรประชาชน" size="small" fullWidth value={newMemberIdCard}
										onChange={(e) => setNewMemberIdCard(e.target.value)} placeholder="1-xxxx-xxxxx-xx-x"
										sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
									<Button variant="contained" onClick={handleAddMember}
										disabled={!newMemberName.trim() || !newMemberPhone.trim()}
										sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, minWidth: 80, bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}>
										เพิ่ม
									</Button>
								</Box>
							</Box>
						</>
					)}
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={() => setMemberDialogOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
						ปิด
					</Button>
				</DialogActions>
			</Dialog>

			{/* ========== Disable/Enable Dialog ========== */}
			<Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
				<DialogTitle sx={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
					<FuseSvgIcon sx={{ color: disableTarget?.isActive ? '#EF4444' : '#22C55E' }} size={24}>
						{disableTarget?.isActive ? 'lucide:ban' : 'lucide:check-circle'}
					</FuseSvgIcon>
					{disableTarget?.isActive ? 'ยืนยันการปิดใช้งาน' : 'ยืนยันการเปิดใช้งาน'}
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 2.5 }}>
					{disableTarget?.isActive ? (
						<>
							<Typography sx={{ fontSize: '15px', color: '#475569', mb: 1.5 }}>คุณต้องการปิดใช้งานทีม:</Typography>
							<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', mb: 2 }}>"{disableTarget?.teamName}"</Typography>
							<Alert severity="warning" sx={{ borderRadius: '10px' }}>
								<Typography sx={{ fontSize: '13px' }}>ทีมที่ปิดใช้งานจะไม่แสดงในรายการ แต่ข้อมูลยังคงอยู่ในระบบ</Typography>
							</Alert>
						</>
					) : (
						<>
							<Typography sx={{ fontSize: '15px', color: '#475569', mb: 1.5 }}>คุณต้องการเปิดใช้งานทีม:</Typography>
							<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>"{disableTarget?.teamName}"</Typography>
						</>
					)}
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={() => setDisableDialogOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
						ยกเลิก
					</Button>
					<Button onClick={handleDisableConfirm} variant="contained"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: disableTarget?.isActive ? '#EF4444' : '#22C55E', '&:hover': { bgcolor: disableTarget?.isActive ? '#DC2626' : '#16A34A' } }}>
						{disableTarget?.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* ========== Snackbar ========== */}
			<Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
				<Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} sx={{ borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Paper>
	);

	return <Root header={header} content={content} scroll="content" />;
}

export default TechniciansPage;
