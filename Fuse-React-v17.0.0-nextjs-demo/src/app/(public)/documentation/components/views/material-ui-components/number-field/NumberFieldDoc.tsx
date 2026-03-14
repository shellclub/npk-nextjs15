// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import FuseExample from '@fuse/core/FuseExample';
import FuseHighlight from '@fuse/core/FuseHighlight';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FieldDemoComponent from '../../../ui/material-ui-components/number-field/FieldDemo';
import FieldDemoRaw from '../../../ui/material-ui-components/number-field/FieldDemo.tsx?raw';
import SpinnerDemoComponent from '../../../ui/material-ui-components/number-field/SpinnerDemo';
import SpinnerDemoRaw from '../../../ui/material-ui-components/number-field/SpinnerDemo.tsx?raw';

function NumberFieldDoc(props) {
	return (
		<>
			<Button
				className="not-prose absolute right-0 normal-case"
				variant="contained"
				color="secondary"
				component="a"
				href="https://mui.com/components/number-field"
				target="_blank"
				role="button"
				size="small"
				startIcon={<FuseSvgIcon size={16}>lucide:square-arrow-out-up-right</FuseSvgIcon>}
			>
				Reference
			</Button>
			<Typography
				className="my-4 text-5xl font-bold"
				component="h1"
			>
				Number Field
			</Typography>
			<Typography className="description">A React component for capturing numeric input from users.</Typography>

			<Typography
				className="mb-8 text-base"
				component="div"
			>
				Number Field is <em>not</em> a built-in <code>@mui/material</code> component—it&#39;s composed of a{' '}
				<a href="https://base-ui.com/react/components/number-field">Base UI Number Field</a> and styled to align
				with Material UI specs.
			</Typography>
			<Typography
				className="mb-8 text-base"
				component="div"
			>
				As such, you must install Base UI before proceeding. The examples that follow can then be copied and
				pasted directly into your app. Note that Base UI is tree-shakeable, so the final bundle will only
				include the components used in your project.
			</Typography>

			<div className="space-y-3">
				<FuseHighlight
					component="pre"
					className="language-bash npm"
				>
					{` 
npm install @base-ui/react
`}
				</FuseHighlight>

				<FuseHighlight
					component="pre"
					className="language-bash pnpm"
				>
					{` 
pnpm add @base-ui/react
`}
				</FuseHighlight>

				<FuseHighlight
					component="pre"
					className="language-bash yarn"
				>
					{` 
yarn add @base-ui/react
`}
				</FuseHighlight>
			</div>

			<Typography
				className="mt-6 mb-2.5 text-3xl font-bold"
				component="h2"
			>
				Usage
			</Typography>
			<ol>
				<li>Select one of the demos below that fits your visual design needs.</li>
				<li>
					Click <strong>Expand code</strong> in the toolbar.
				</li>
				<li>
					Select the file that starts with <code>./components/</code>.
				</li>
				<li>Copy the code and paste it into your project.</li>
			</ol>
			<Typography
				className="mt-6 mb-2.5 text-3xl font-bold"
				component="h2"
			>
				Outlined field
			</Typography>
			<Typography
				className="mb-8 text-base"
				component="div"
			>
				The outlined field component uses{' '}
				<a href="/material-ui/react-text-field/#components">text-field composition</a> with end adornments for
				the increment and decrement buttons.
			</Typography>
			<Typography
				className="mb-8 text-base"
				component="div"
			>
				<FuseExample
					name="FieldDemo.js"
					className="my-4"
					iframe={false}
					component={FieldDemoComponent}
					raw={FieldDemoRaw}
				/>
			</Typography>
			<Typography
				className="mt-6 mb-2.5 text-3xl font-bold"
				component="h2"
			>
				Spinner field
			</Typography>
			<Typography
				className="mb-8 text-base"
				component="div"
			>
				For the spinner field component, the increment and decrement buttons are placed next to the outlined
				input. This is ideal for touch devices and narrow ranges of values.
			</Typography>
			<Typography
				className="mb-8 text-base"
				component="div"
			>
				<FuseExample
					name="SpinnerDemo.js"
					className="my-4"
					iframe={false}
					component={SpinnerDemoComponent}
					raw={SpinnerDemoRaw}
				/>
			</Typography>
			<Typography
				className="mt-6 mb-2.5 text-3xl font-bold"
				component="h2"
			>
				Base UI API
			</Typography>
			<Typography
				className="mb-8 text-base"
				component="div"
			>
				See the documentation below for a complete reference to all of the props.
			</Typography>
			<ul className="space-y-4">
				<li>
					<a href="https://base-ui.com/react/components/number-field#api-reference">
						<code>{`<NumberField />`}</code>
					</a>
				</li>
			</ul>
		</>
	);
}

export default NumberFieldDoc;
