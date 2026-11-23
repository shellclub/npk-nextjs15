import { Upload } from 'lucide-react';
import { useId } from 'react';

export function FileDrop({
	label = 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือก',
	accept,
	multiple,
	onFiles
}: {
	label?: string;
	accept?: string;
	multiple?: boolean;
	onFiles: (files: File[]) => void;
}) {
	const id = useId();
	return (
		<label
			htmlFor={id}
			className="border-brand bg-surface-2 text-primary-ink focus-within:outline-focus flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-4 text-center text-sm focus-within:outline-2 focus-within:outline-offset-2"
		>
			<Upload
				aria-hidden="true"
				size={20}
			/>
			{label}
			<input
				id={id}
				type="file"
				className="sr-only"
				accept={accept}
				multiple={multiple}
				onChange={(e) => {
					onFiles(Array.from(e.target.files ?? []));
					e.target.value = '';
				}}
			/>
		</label>
	);
}
