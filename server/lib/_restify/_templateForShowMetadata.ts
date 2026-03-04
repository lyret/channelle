/**
 * HTML template for show social sharing pages
 * Uses template literals with placeholders for dynamic content
 */
export function getShowSocialTemplate(show: { id: number; name: string; description: string }, slug: string): string {
	show.name = escapeHtml(show.name);
	show.description = escapeHtml(show.description);

	const showUrl = `${CONFIG.web.host}/${slug}`;
	const showImage = `${CONFIG.web.host}/assets/images/logo.gif`;
	const theaterUrl = CONFIG.web.host;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${show.name} - Channelle</title>

	<!-- OpenGraph / Facebook -->
	<meta property="og:type" content="website">
	<meta property="og:url" content="${showUrl}">
	<meta property="og:title" content="${show.name}">
	<meta property="og:description" content="${show.description || "A Channelle performance"}">
	<meta property="og:image" content="${showImage}">
	<meta property="og:image:width" content="1200">
	<meta property="og:image:height" content="630">
	<meta property="og:site_name" content="Channelle">

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:title" content="${show.name}">
	<meta name="twitter:description" content="${show.description || "A Channelle performance"}">
	<meta name="twitter:image" content="${showImage}">

	<!-- Favicon -->
	<link rel="icon" href="${theaterUrl}/assets/images/favicon.ico" type="image/x-icon">

	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			margin: 0;
			padding: 0;
			background-color: #f5f5f5;
			color: #333;
		}

		.container {
			max-width: 800px;
			margin: 0 auto;
			padding: 2rem;
			text-align: center;
		}

		h1 {
			color: #2c3e50;
			font-size: 2.5rem;
			margin-bottom: 1rem;
		}

		.description {
			font-size: 1.1rem;
			line-height: 1.6;
			color: #555;
			margin-bottom: 2rem;
		}

		.cta-button {
			background-color: #3498db;
			color: white;
			padding: 12px 24px;
			border: none;
			border-radius: 4px;
			font-size: 1rem;
			cursor: pointer;
			text-decoration: none;
			display: inline-block;
			transition: background-color 0.3s;
		}

		.cta-button:hover {
			background-color: #2980b9;
		}

		.status-message {
			margin-top: 2rem;
			padding: 1rem;
			background-color: #fff3cd;
			border-left: 4px solid #ffc107;
			text-align: left;
		}

		.footer {
			margin-top: 3rem;
			font-size: 0.9rem;
			color: #777;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>${show.name}</h1>

		${show.description ? `<p class="description">${show.description}</p>` : ""}

		<a href="${theaterUrl}" class="cta-button">Back to Theater</a>

		<div class="status-message">
			<p><strong>Show Status:</strong> The stage server is currently not running. This performance will be available when the stage server is started.</p>
		</div>

		<div class="footer">
			<p>Powered by <a href="${theaterUrl}" style="color: #3498db;">Channelle</a></p>
		</div>
	</div>

	<script>
		// Simple SSO optimization: auto-redirect if coming from known SSO providers
		const ssoProviders = ['google', 'facebook', 'microsoft', 'apple', 'auth0'];
		const referrer = document.referrer.toLowerCase();

		if (ssoProviders.some(provider => referrer.includes(provider))) {
			// Store SSO context for potential auto-login when stage becomes available
			localStorage.setItem('ssoRedirectContext', JSON.stringify({
				provider: ssoProviders.find(p => referrer.includes(p)),
				timestamp: Date.now(),
				showId: ${show.id}
			}));
		}
	</script>
</body>
</html>`;
}

/**
 * Utility function to escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#039;",
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}
