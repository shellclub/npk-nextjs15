import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig, NextAuthResult } from 'next-auth';
import type { User } from '@auth/user';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { menusForRole } from '@/lib/permissions-server';

const config = {
	pages: { signIn: '/sign-in' },
	providers: [
		Credentials({
			async authorize(credentials) {
				const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
				const password = typeof credentials?.password === 'string' ? credentials.password : '';

				if (!email || !password) return null;

				const dbUser = await prisma.user.findUnique({ where: { email } });

				if (!dbUser || !dbUser.isActive || !verifyPassword(password, dbUser.password)) return null;

				return { id: dbUser.id, email: dbUser.email, name: dbUser.name, image: dbUser.avatar };
			}
		})
	],
	basePath: '/auth',
	trustHost: true,
	callbacks: {
		jwt({ token, user }) {
			if (user?.id) token.userId = user.id;

			return token;
		},
		async session({ session, token }) {
			const userId = typeof token.userId === 'string' ? token.userId : undefined;
			const dbUser = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

			// ผู้ใช้ถูกลบหรือปิดใช้งานหลังออก token → ถือเป็น guest (ไม่มี session.db)
			if (!dbUser?.isActive) return { ...session, db: undefined as unknown as User };

			session.db = {
				id: dbUser.id,
				email: dbUser.email,
				displayName: dbUser.name,
				photoURL: dbUser.avatar ?? undefined,
				role: [dbUser.role.toLowerCase()],
				menus: dbUser.role === 'ADMIN' ? [] : await menusForRole(dbUser.role)
			};

			return session;
		}
	},
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60 // 30 วัน
	},
	debug: false
} satisfies NextAuthConfig;

const nextAuth: NextAuthResult = NextAuth(config);

export const { handlers, auth } = nextAuth;
