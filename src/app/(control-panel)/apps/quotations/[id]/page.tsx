'use client';

import { use } from 'react';
import { QuotationForm } from '@/components/quotations/QuotationForm';

export default function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);

	return <QuotationForm id={id} />;
}
