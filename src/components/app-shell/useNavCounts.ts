'use client';

import { useQuery } from '@tanstack/react-query';

export type NavCounts = { workOrdersPending: number; pendingPayments: number; overdueInvoices: number };

export function useNavCounts() {
	return useQuery<NavCounts>({
		queryKey: ['nav-counts'],
		queryFn: async () => (await fetch('/api/nav-counts')).json(),
		refetchInterval: 60_000
	});
}
