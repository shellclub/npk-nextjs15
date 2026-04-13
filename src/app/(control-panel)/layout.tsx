import MainLayout from 'src/components/MainLayout';
import AuthGuardRedirect from '@auth/AuthGuardRedirect';
import { AlertProvider } from '@/components/shared/AlertProvider';

function Layout({ children }) {
	return (
		<AuthGuardRedirect auth={['admin']}>
			<AlertProvider>
				<MainLayout>{children}</MainLayout>
			</AlertProvider>
		</AuthGuardRedirect>
	);
}

export default Layout;
