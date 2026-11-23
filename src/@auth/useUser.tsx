import { signOut, useSession } from 'next-auth/react';
import { useMemo } from 'react';
import type { User } from '@auth/user';

type UseUser = {
	data: User | null;
	isGuest: boolean;
	isLoading: boolean;
	signOut: () => Promise<void>;
};

function useUser(): UseUser {
	const { data, status } = useSession();
	const user = useMemo(() => data?.db ?? null, [data]);
	const isGuest = !user?.role || user.role.length === 0;

	return {
		data: user,
		isGuest,
		isLoading: status === 'loading',
		signOut: async () => {
			await signOut({ callbackUrl: '/sign-in' });
		}
	};
}

export default useUser;
