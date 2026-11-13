import authRoles from '@auth/authRoles';
import AuthGuardRedirect from '@auth/AuthGuardRedirect';
import { AlertProvider } from '@/components/shared/AlertProvider';
import { AppShell } from '@/components/app-shell/AppShell';
import { PageAccessGuard } from '@/components/app-shell/PageAccessGuard';

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<AuthGuardRedirect auth={authRoles.staff}>
			<AlertProvider>
				<AppShell>
					<PageAccessGuard>{children}</PageAccessGuard>
				</AppShell>
			</AlertProvider>
		</AuthGuardRedirect>
	);
}

export default Layout;
