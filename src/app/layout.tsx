import 'src/styles/index.css';
import { Prompt, Sarabun } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@auth/authJs';
import generateMetadata from '../utils/generateMetadata';
import App from './App';

const prompt = Prompt({
	subsets: ['thai', 'latin'],
	weight: ['400', '500', '600'],
	variable: '--font-prompt',
	display: 'swap'
});
const sarabun = Sarabun({
	subsets: ['thai', 'latin'],
	weight: ['400', '600'],
	variable: '--font-sarabun',
	display: 'swap'
});

// eslint-disable-next-line react-refresh/only-export-components
export const metadata = await generateMetadata({
	title: 'NPK Service & Supply - ระบบจัดการเอกสารธุรกิจ',
	description: 'ระบบจัดการเอกสารธุรกิจ NPK Service & Supply Co.,Ltd',
	cardImage: '/card.png',
	robots: 'follow, index',
	favicon: '/favicon.ico',
	url: 'http://localhost:3000'
});

export default async function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();

	return (
		<html
			lang="th"
			className={`${prompt.variable} ${sarabun.variable}`}
		>
			<head>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, shrink-to-fit=no"
				/>
				<meta
					name="theme-color"
					content="#000000"
				/>
				<base href="/" />
				{/*
					manifest.json provides metadata used when your web app is added to the
					homescreen on Android. See https://developers.google.com/web/fundamentals/engage-and-retain/web-app-manifest/
				*/}
				<link
					rel="manifest"
					href="/manifest.json"
				/>
				<link
					rel="shortcut icon"
					href="/favicon.ico"
				/>
			</head>
			<body id="root">
				<SessionProvider
					basePath="/auth"
					session={session}
				>
					<App>{children}</App>
				</SessionProvider>
			</body>
		</html>
	);
}
