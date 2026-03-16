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
