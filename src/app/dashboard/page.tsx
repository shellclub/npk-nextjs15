import { redirect } from 'next/navigation';

function DashboardRedirectPage() {
	redirect(`/dashboards/project`);
	return null;
}

export default DashboardRedirectPage;
