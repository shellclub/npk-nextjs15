// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import FuseExample from '@fuse/core/FuseExample';
import FuseHighlight from '@fuse/core/FuseHighlight';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import BasicTabsComponent from '../../../ui/material-ui-components/tabs/BasicTabs';
import BasicTabsRaw from '../../../ui/material-ui-components/tabs/BasicTabs.tsx?raw';

function TabsDoc(props) {
	return (
		<>
			<Button
				className="not-prose absolute right-0 normal-case"
				variant="contained"
				color="secondary"
				component="a"
				href="https://mui.com/components/tabs"
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
				Tabs
			</Typography>
			<Typography className="description">
				Tabs make it easy to explore and switch between different views.
			</Typography>

			<Typography
				className="mb-8 text-base"
				component="div"
			>
				Tabs organize and allow navigation between groups of content that are related and at the same level of
				hierarchy.
			</Typography>
			<Typography
				className="mt-6 mb-2.5 text-3xl font-bold"
				component="h2"
			>
				Introduction
			</Typography>
			<Typography
				className="mb-8 text-base"
				component="div"
			>
				Tabs are implemented using a collection of related components:
			</Typography>
			<ul className="space-y-4">
				<li>
					<code>{`<Tab />`}</code> - the tab element itself. Clicking on a tab displays its corresponding
					panel.
				</li>
				<li>
					<code>{`<Tabs />`}</code> - the container that houses the tabs. Responsible for handling focus and
					keyboard navigation between tabs.
				</li>
			</ul>
			<Typography
				className="mb-8 text-base"
				component="div"
			>
				<FuseExample
					name="BasicTabs.js"
					className="my-4"
					iframe={false}
					component={BasicTabsComponent}
					raw={BasicTabsRaw}
				/>
			</Typography>
			<Typography
				className="mt-6 mb-2.5 text-3xl font-bold"
				component="h2"
			>
				Basics
			</Typography>

			<FuseHighlight
				component="pre"
				className="language-jsx"
			>
				{` 
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
`}
			</FuseHighlight>
		</>
	);
}

export default TabsDoc;
