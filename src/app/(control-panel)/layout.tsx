import authRoles from '@auth/authRoles';
import AuthGuardRedirect from '@auth/AuthGuardRedirect';
import { AlertProvider } from '@/components/shared/AlertProvider';
import { AppShell } from '@/components/app-shell/AppShell';

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<AuthGuardRedirect auth={authRoles.staff}>
			<AlertProvider>
				<AppShell>{children}</AppShell>
			</AlertProvider>
		</AuthGuardRedirect>
	);
}

export default Layout;
