'use client';

import clsx from 'clsx';
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

type AlertType = 'success' | 'error' | 'warning' | 'info';
type AlertState = { open: boolean; type: AlertType; title: string; message: string };

type AlertContextType = {
	showAlert: (type: AlertType, title: string, message?: string, autoClose?: number) => void;
	showSuccess: (title: string, message?: string) => void;
	showError: (title: string, message?: string) => void;
	showWarning: (title: string, message?: string) => void;
	showInfo: (title: string, message?: string) => void;
};

const AlertContext = createContext<AlertContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAlert() {
	const ctx = useContext(AlertContext);

	if (!ctx) throw new Error('useAlert must be used within AlertProvider');

	return ctx;
}

const META: Record<AlertType, { Icon: typeof Info; cls: string; title: string }> = {
	success: { Icon: CheckCircle2, cls: 'text-success', title: 'สำเร็จ' },
	error: { Icon: XCircle, cls: 'text-danger', title: 'เกิดข้อผิดพลาด' },
	warning: { Icon: TriangleAlert, cls: 'text-warn', title: 'แจ้งเตือน' },
	info: { Icon: Info, cls: 'text-info', title: 'ข้อมูล' }
};

export function AlertProvider({ children }: { children: ReactNode }) {
	const [alert, setAlert] = useState<AlertState>({ open: false, type: 'success', title: '', message: '' });
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	const close = useCallback(() => setAlert((p) => ({ ...p, open: false })), []);

	const showAlert = useCallback(
		(type: AlertType, title: string, message = '', autoClose = 2500) => {
			clearTimeout(timer.current);
			setAlert({ open: true, type, title, message });

			if (autoClose > 0) timer.current = setTimeout(close, autoClose);
		},
		[close]
	);

	useEffect(() => () => clearTimeout(timer.current), []);

	const value: AlertContextType = {
		showAlert,
		showSuccess: (t, m) => showAlert('success', t, m),
		showError: (t, m) => showAlert('error', t, m, 0),
		showWarning: (t, m) => showAlert('warning', t, m, 3500),
		showInfo: (t, m) => showAlert('info', t, m)
	};
	const { Icon, cls } = META[alert.type];

	return (
		<AlertContext.Provider value={value}>
			{children}
			<Dialog
				open={alert.open}
				onClose={close}
				title={META[alert.type].title}
				size="sm"
				footer={<Button onClick={close}>ตกลง</Button>}
			>
				<div
					role="alert"
					className="flex items-start gap-4"
				>
					<Icon
						aria-hidden="true"
						size={36}
						className={clsx('shrink-0', cls)}
					/>
					<div>
						<p className="font-display text-lg font-semibold">{alert.title}</p>
						{alert.message && <p className="text-ink-muted text-[15px] leading-6">{alert.message}</p>}
					</div>
				</div>
			</Dialog>
		</AlertContext.Provider>
	);
}
