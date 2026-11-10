import type { User } from '@auth/user';

declare module 'next-auth' {
	interface Session {
		db: User;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		userId?: string;
	}
}
