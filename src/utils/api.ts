import ky, { KyInstance } from 'ky';

export const API_BASE_URL = (() => {
	if (process.env.NODE_ENV === 'development') {
		return `http://localhost:${process.env.NEXT_PUBLIC_PORT || 3000}`;
	}

	// Server-side in production: use localhost (inside Docker container)
	if (typeof window === 'undefined') {
		return 'http://localhost:3000';
	}

	// Client-side in production: use the public URL
	return process.env.NEXT_PUBLIC_BASE_URL || '/';
})();

let globalHeaders: Record<string, string> = {};

export const api: KyInstance = ky.create({
	prefixUrl: `${API_BASE_URL}/api`,
	hooks: {
		beforeRequest: [
			(request) => {
				Object.entries(globalHeaders).forEach(([key, value]) => {
					request.headers.set(key, value);
				});
			}
		]
	},
	retry: {
		limit: 2,
		methods: ['get', 'put', 'head', 'delete', 'options', 'trace']
	}
});

export const setGlobalHeaders = (headers: Record<string, string>) => {
	globalHeaders = { ...globalHeaders, ...headers };
};

export const removeGlobalHeaders = (headerKeys: string[]) => {
	headerKeys.forEach((key) => {
		delete globalHeaders[key];
	});
};

export const getGlobalHeaders = () => {
	return globalHeaders;
};

export default api;
