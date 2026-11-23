import clsx from 'clsx';
import { formatMoney } from '@/lib/format';

export function MoneyText({
	value,
	decimals = 2,
	className,
	sign
}: {
	value: number | string | null | undefined;
	decimals?: 0 | 2;
	className?: string;
	sign?: '+' | '-';
}) {
	return (
		<span
			className={clsx(
				'whitespace-nowrap tabular-nums',
				sign === '+' && 'text-success',
				sign === '-' && 'text-danger',
				className
			)}
		>
			{sign}
			{formatMoney(value, decimals)}
		</span>
	);
}
