function Layout({ children }: { children: React.ReactNode }) {
	return <div className="bg-canvas text-ink min-h-screen font-sans">{children}</div>;
}

export default Layout;
