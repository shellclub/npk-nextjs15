'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { keyframes } from '@mui/material/styles';

// ═══════════════════════════════════════════
// SweetAlert-style Notification Component
// ═══════════════════════════════════════════

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
	open: boolean;
	type: AlertType;
	title: string;
	message: string;
	autoClose?: number; // ms, 0 = manual close only
}

interface AlertContextType {
	showAlert: (type: AlertType, title: string, message?: string, autoClose?: number) => void;
	showSuccess: (title: string, message?: string) => void;
	showError: (title: string, message?: string) => void;
	showWarning: (title: string, message?: string) => void;
	showInfo: (title: string, message?: string) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAlert() {
	const ctx = useContext(AlertContext);
	if (!ctx) throw new Error('useAlert must be used within AlertProvider');
	return ctx;
}

// ═══ Animations ═══
const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
`;

const checkDraw = keyframes`
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
`;

const crossDraw = keyframes`
  0% { stroke-dashoffset: 80; }
  100% { stroke-dashoffset: 0; }
`;

const pulseRing = keyframes`
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
`;

// ═══ Icon Components ═══
function SuccessIcon() {
	return (
		<Box sx={{ position: 'relative', width: 80, height: 80 }}>
			<Box sx={{
				position: 'absolute', inset: 0, borderRadius: '50%',
				bgcolor: '#22C55E20', animation: `${pulseRing} 1s ease-out`,
			}} />
			<svg viewBox="0 0 80 80" width="80" height="80">
				<circle cx="40" cy="40" r="36" fill="none" stroke="#22C55E" strokeWidth="3"
					style={{ animation: `${popIn} 0.4s ease-out` }} />
				<path d="M24 42 L35 53 L56 28" fill="none" stroke="#22C55E" strokeWidth="4"
					strokeLinecap="round" strokeLinejoin="round"
					style={{ strokeDasharray: 100, animation: `${checkDraw} 0.5s ease-out 0.3s both` }} />
			</svg>
		</Box>
	);
}

function ErrorIcon() {
	return (
		<Box sx={{ position: 'relative', width: 80, height: 80 }}>
			<Box sx={{
				position: 'absolute', inset: 0, borderRadius: '50%',
				bgcolor: '#EF444420', animation: `${pulseRing} 1s ease-out`,
			}} />
			<svg viewBox="0 0 80 80" width="80" height="80">
				<circle cx="40" cy="40" r="36" fill="none" stroke="#EF4444" strokeWidth="3"
					style={{ animation: `${popIn} 0.4s ease-out` }} />
				<path d="M28 28 L52 52" fill="none" stroke="#EF4444" strokeWidth="4"
					strokeLinecap="round"
					style={{ strokeDasharray: 80, animation: `${crossDraw} 0.4s ease-out 0.3s both` }} />
				<path d="M52 28 L28 52" fill="none" stroke="#EF4444" strokeWidth="4"
					strokeLinecap="round"
					style={{ strokeDasharray: 80, animation: `${crossDraw} 0.4s ease-out 0.5s both` }} />
			</svg>
		</Box>
	);
}

function WarningIcon() {
	return (
		<Box sx={{ position: 'relative', width: 80, height: 80 }}>
			<Box sx={{
				position: 'absolute', inset: 0, borderRadius: '50%',
				bgcolor: '#F59E0B20', animation: `${pulseRing} 1s ease-out`,
			}} />
			<svg viewBox="0 0 80 80" width="80" height="80">
				<circle cx="40" cy="40" r="36" fill="none" stroke="#F59E0B" strokeWidth="3"
					style={{ animation: `${popIn} 0.4s ease-out` }} />
				<text x="40" y="48" textAnchor="middle" fill="#F59E0B" fontSize="42" fontWeight="800"
					style={{ animation: `${popIn} 0.5s ease-out 0.2s both` }}>!</text>
			</svg>
		</Box>
	);
}

function InfoIcon() {
	return (
		<Box sx={{ position: 'relative', width: 80, height: 80 }}>
			<Box sx={{
				position: 'absolute', inset: 0, borderRadius: '50%',
				bgcolor: '#3B82F620', animation: `${pulseRing} 1s ease-out`,
			}} />
			<svg viewBox="0 0 80 80" width="80" height="80">
				<circle cx="40" cy="40" r="36" fill="none" stroke="#3B82F6" strokeWidth="3"
					style={{ animation: `${popIn} 0.4s ease-out` }} />
				<text x="40" y="50" textAnchor="middle" fill="#3B82F6" fontSize="38" fontWeight="800"
					fontStyle="italic" style={{ animation: `${popIn} 0.5s ease-out 0.2s both` }}>i</text>
			</svg>
		</Box>
	);
}

const iconMap: Record<AlertType, () => ReactNode> = {
	success: SuccessIcon,
	error: ErrorIcon,
	warning: WarningIcon,
	info: InfoIcon,
};

const colorMap: Record<AlertType, { btn: string; btnHover: string }> = {
	success: { btn: 'linear-gradient(135deg, #22C55E, #16A34A)', btnHover: 'linear-gradient(135deg, #16A34A, #15803D)' },
	error: { btn: 'linear-gradient(135deg, #EF4444, #DC2626)', btnHover: 'linear-gradient(135deg, #DC2626, #B91C1C)' },
	warning: { btn: 'linear-gradient(135deg, #F59E0B, #D97706)', btnHover: 'linear-gradient(135deg, #D97706, #B45309)' },
	info: { btn: 'linear-gradient(135deg, #3B82F6, #2563EB)', btnHover: 'linear-gradient(135deg, #2563EB, #1D4ED8)' },
};

export function AlertProvider({ children }: { children: ReactNode }) {
	const [alert, setAlert] = useState<AlertState>({ open: false, type: 'success', title: '', message: '' });

	const showAlert = useCallback((type: AlertType, title: string, message = '', autoClose = 2500) => {
		setAlert({ open: true, type, title, message, autoClose });
		if (autoClose > 0) {
			setTimeout(() => setAlert(prev => ({ ...prev, open: false })), autoClose);
		}
	}, []);

	const showSuccess = useCallback((title: string, message = '') => showAlert('success', title, message), [showAlert]);
	const showError = useCallback((title: string, message = '') => showAlert('error', title, message, 0), [showAlert]); // errors don't auto-close
	const showWarning = useCallback((title: string, message = '') => showAlert('warning', title, message, 3500), [showAlert]);
	const showInfo = useCallback((title: string, message = '') => showAlert('info', title, message), [showAlert]);

	const handleClose = () => setAlert(prev => ({ ...prev, open: false }));
	const Icon = iconMap[alert.type];
	const colors = colorMap[alert.type];

	return (
		<AlertContext.Provider value={{ showAlert, showSuccess, showError, showWarning, showInfo }}>
			{children}

			<Dialog
				open={alert.open}
				onClose={handleClose}
				maxWidth="xs"
				fullWidth
				slotProps={{
					backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' } },
				}}
				PaperProps={{
					sx: {
						borderRadius: '20px',
						boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
						overflow: 'hidden',
					},
				}}
			>
				<DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
					{/* Icon */}
					<Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
						<Icon />
					</Box>

					{/* Title */}
					<Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', mb: 1, letterSpacing: '-0.02em' }}>
						{alert.title}
					</Typography>

					{/* Message */}
					{alert.message && (
						<Typography sx={{ fontSize: '15px', color: '#64748B', mb: 2.5, lineHeight: 1.6 }}>
							{alert.message}
						</Typography>
					)}

					{/* Button */}
					<Button
						variant="contained"
						onClick={handleClose}
						sx={{
							borderRadius: '12px',
							textTransform: 'none',
							fontWeight: 700,
							fontSize: '15px',
							px: 5,
							py: 1.2,
							background: colors.btn,
							boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
							'&:hover': { background: colors.btnHover },
						}}
					>
						ตกลง
					</Button>
				</DialogContent>
			</Dialog>
		</AlertContext.Provider>
	);
}
