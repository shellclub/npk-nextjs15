import type { NextConfig } from 'next';

const isTurbopack = process.env.TURBOPACK === '1';

// Conditionally add webpack configuration only when NOT using turbopack
const nextConfig: NextConfig = {
	output: 'standalone',
	reactStrictMode: false,
	typescript: {
		// Allow production builds to complete even with type errors
		ignoreBuildErrors: true
	},
	async rewrites() {
		// ไฟล์อัปโหลดหลัง build (รูปหน้างาน ฯลฯ) เสิร์ฟผ่าน API เพราะโหมด standalone ไม่เสิร์ฟไฟล์ใหม่ใน public
		return {
			beforeFiles: [{ source: '/uploads/:path*', destination: '/api/files/:path*' }],
			afterFiles: [],
			fallback: []
		};
	},
	turbopack: {
		root: __dirname,
		rules: {}
	},
	...(!isTurbopack && {
		webpack: (config) => {
			if (config.module && config.module.rules) {
				config.module.rules.push({
					test: /\.(json|js|ts|tsx|jsx)$/,
					resourceQuery: /raw/,
					use: 'raw-loader'
				});
			}

			return config;
		}
	})
};

export default nextConfig;
