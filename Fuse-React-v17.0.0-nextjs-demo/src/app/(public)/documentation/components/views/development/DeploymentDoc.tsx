import Typography from '@mui/material/Typography';

/**
 * Deployment Doc
 * This document provides information on how to deploy the application.
 */
function DeploymentDoc() {
	return (
		<>
			<Typography
				variant="h4"
				className="mb-10 font-bold"
			>
				Deployment
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				Next.js applications can be deployed to various platforms. Here are two options we've tested:
			</Typography>

			<Typography
				variant="h6"
				className="mt-8 mb-4"
			>
				1. Vercel (Default)
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				Vercel, created by the team behind Next.js, is the default and recommended deployment platform for
				Next.js applications.
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				To deploy to Vercel:
			</Typography>

			<ol className="mb-4 ml-4 list-decimal space-y-2">
				<li>Push your code to a Git repository (GitHub, GitLab, or Bitbucket)</li>
				<li>Import your project into Vercel</li>
				<li>Vercel will automatically detect Next.js and configure the build settings</li>
				<li>Deploy with a single click</li>
			</ol>

			<Typography
				className="mb-4"
				component="p"
			>
				Vercel offers features like automatic HTTPS, CDN, continuous deployment, and more.
			</Typography>

			<Typography
				variant="h6"
				className="mt-8 mb-4"
			>
				2. Coolify
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				Coolify is an open-source, self-hostable alternative that we've also tested for deploying Next.js
				applications.
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				To deploy with Coolify:
			</Typography>

			<ol className="mb-4 ml-4 list-decimal space-y-2">
				<li>Set up a Coolify instance on your own server</li>
				<li>Connect your Git repository to Coolify</li>
				<li>
					Configure the build and start commands:
					<ul>
						<li>
							Build Command: <code>npm run build</code>
						</li>
						<li>
							Start Command: <code>npm run start</code>
						</li>
					</ul>
				</li>
				<li>Deploy your application</li>
			</ol>

			<Typography
				className="mb-4"
				component="p"
			>
				Coolify provides features like automatic HTTPS, easy rollbacks, and database management, all on your own
				infrastructure.
			</Typography>

			<Typography
				className="mt-8 mb-4"
				component="p"
			>
				Regardless of the deployment service you choose, ensure that all environment variables are properly set
				and that your application is thoroughly tested in a production-like environment before deploying.
			</Typography>
		</>
	);
}

export default DeploymentDoc;
