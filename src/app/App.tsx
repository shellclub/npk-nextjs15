'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';

/** Provider หลักของแอป: React Query เท่านั้น (ธีม/ตัวช่วย UI อยู่ใน Tailwind + src/components/ui) */
function App({ children }: { children?: ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000, // 5 นาที
						retry: 1
					}
				}
			})
	);

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default App;
