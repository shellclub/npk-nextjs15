
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import FuseExample from '@fuse/core/FuseExample';
import FuseHighlight from '@fuse/core/FuseHighlight';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Button from '@mui/material/Button';
import Icon from '@mui/material/Icon';
import Typography from '@mui/material/Typography';


function InitColorSchemeScriptDoc(props) {
	return (
		<>
			<Button
				className="normal-case absolute right-0 not-prose"
				variant="contained"
				color="secondary"
				component="a"
				href="https://mui.com/components/init-color-scheme-script"
				target="_blank"
				role="button"
				size="small"
				startIcon={<FuseSvgIcon size={16}>lucide:square-arrow-out-up-right</FuseSvgIcon>}
			>
				Reference
			</Button>
			<Typography className="text-5xl my-4 font-bold" component="h1">InitColorSchemeScript</Typography>
<Typography className="description">The InitColorSchemeScript component eliminates dark mode flickering in server-side-rendered applications.</Typography>

<Typography className="text-3xl mt-6 mb-2.5 font-bold" component="h2">Introduction</Typography>
<Typography className="text-base mb-8" component="div">The <code>{`InitColorSchemeScript`}</code> component is used to remove the dark mode flicker that can occur in server-side-rendered (SSR) applications.
This script runs before React to attach an attribute based on the user preference so that the correct color mode is applied on first render.</Typography>
<Typography className="text-base mb-8" component="div">For the best user experience, you should implement this component in any server-rendered Material UI app that supports both light and dark modes.</Typography>
<Typography className="text-3xl mt-6 mb-2.5 font-bold" component="h2">Basics</Typography>
<Typography className="text-base mb-8" component="div">First, enable CSS variables with <code>{`colorSchemeSelector: 'data'`}</code> in your theme.</Typography>

<FuseHighlight component="pre" className="language-js">
{` 
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data',
  },
});

function App() {
  return <ThemeProvider theme={theme}>{/* Your app */}</ThemeProvider>;
}
`}
</FuseHighlight>
<Typography className="text-base mb-8" component="div">Then, render the <code>{`InitColorSchemeScript`}</code> component as the first child of the <code>{`<body>`}</code> tag.</Typography>
<Typography className="text-base mb-8" component="div">The sections below detail where to render the <code>{`InitColorSchemeScript`}</code> component when working with Next.js.</Typography>
<Typography className="text-lg mt-5 mb-2.5 font-bold" component="h3">Next.js App Router</Typography>
<Typography className="text-base mb-8" component="div">Place the <code>{`InitColorSchemeScript`}</code> component in the root <code>{`layout`}</code> file:</Typography>

<FuseHighlight component="pre" className="language-js" title="src/app/layout.tsx">
{` 
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="data" />
        {props.children}
      </body>
    </html>
  );
}
`}
</FuseHighlight>
<Typography className="text-lg mt-5 mb-2.5 font-bold" component="h3">Next.js Pages Router</Typography>
<Typography className="text-base mb-8" component="div">Place the <code>{`InitColorSchemeScript`}</code> component in a custom <code>{`_document`}</code> file:</Typography>

<FuseHighlight component="pre" className="language-js" title="pages/document.tsx">
{` 
import { Html, Head, Main, NextScript } from 'next/document';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';

export default function MyDocument(props) {
  return (
    <Html lang="en">
      <Head>{/* tags */}</Head>
      <body>
        <InitColorSchemeScript attribute="data" />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
`}
</FuseHighlight>
<Typography className="text-3xl mt-6 mb-2.5 font-bold" component="h2">Customization</Typography>
<Typography className="text-lg mt-5 mb-2.5 font-bold" component="h3">Class attribute</Typography>
<Typography className="text-base mb-8" component="div">To attach classes to DOM elements, set the <code>{`attribute`}</code> prop to <code>{`"class"`}</code>.</Typography>

<FuseHighlight component="pre" className="language-js">
{` 
<InitColorSchemeScript attribute="class" />
`}
</FuseHighlight>
<Typography className="text-base mb-8" component="div">This sets the class name on the color scheme node (which defaults to <code>{`<html>`}</code>) according to the user&#39;s system preference.</Typography>

<FuseHighlight component="pre" className="language-html">
{` 
<html className="dark"></html>
`}
</FuseHighlight>
<Typography className="text-lg mt-5 mb-2.5 font-bold" component="h3">Arbitrary attribute</Typography>
<Typography className="text-base mb-8" component="div">To attach arbitrary attributes to DOM elements, use <code>{`%s`}</code> as a placeholder on the <code>{`attribute`}</code> prop.</Typography>

<FuseHighlight component="pre" className="language-js">
{` 
<InitColorSchemeScript attribute="[data-theme='%s']" /> // <html data-theme="dark">
<InitColorSchemeScript attribute=".mode-%s" /> // <html className="mode-dark">
`}
</FuseHighlight>
<Typography className="text-lg mt-5 mb-2.5 font-bold" component="h3">Default mode</Typography>
<Typography className="text-base mb-8" component="div">Set the <code>{`defaultMode`}</code> prop to specify the default mode when the user first visits the page.</Typography>
<Typography className="text-base mb-8" component="div">For example, if you want users to see the dark mode on their first visit, set the <code>{`defaultMode`}</code> prop to <code>{`"dark"`}</code>.</Typography>

<FuseHighlight component="pre" className="language-js">
{` 
<InitColorSchemeScript defaultMode="dark" />
`}
</FuseHighlight>
<Typography className="text-3xl mt-6 mb-2.5 font-bold" component="h2">Caveats</Typography>
<Typography className="text-lg mt-5 mb-2.5 font-bold" component="h3">Attribute</Typography>
<Typography className="text-base mb-8" component="div">When customizing the <code>{`attribute`}</code> prop, make sure to set the <code>{`colorSchemeSelector`}</code> in the theme to match the attribute you are using.</Typography>

<FuseHighlight component="pre" className="language-js">
{` 
const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'same value as the \`attribute\` prop',
  },
});
`}
</FuseHighlight>
<Typography className="text-lg mt-5 mb-2.5 font-bold" component="h3">Default mode</Typography>
<Typography className="text-base mb-8" component="div">When customizing the <code>{`defaultMode`}</code> prop, make sure to do the same with the <code>{`ThemeProvider`}</code> component:</Typography>

<FuseHighlight component="pre" className="language-js">
{` 
<ThemeProvider theme={theme} defaultMode="dark">
`}
</FuseHighlight>

		</>
	);
}

export default InitColorSchemeScriptDoc;
