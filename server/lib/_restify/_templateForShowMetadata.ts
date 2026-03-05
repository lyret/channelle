/**
 * HTML template for show social sharing pages
 * Uses template literals with placeholders for dynamic content
 */
export function getShowSocialTemplate(show: { id: number; name: string; description: string; nomenclature: string }, slug: string): string {
	show.name = escapeHtml(show.name);
	show.description = escapeHtml(show.description);

	const showUrl = `${CONFIG.ipc.theaterServerUrl}/f/${slug}`;
	const imageUrl = `${CONFIG.ipc.theaterServerUrl}/opengraph.jpg`;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${show.name} - Channelle</title>

	<!-- Open Graph -->
	<meta property="og:type" content="website">
	<meta property="og:url" content="${showUrl}">
	<meta property="og:title" content="${show.name}">
	<meta property="og:description" content="${show.description || "En föreställning på Channelle"}">
	<meta property="og:site_name" content="Channelle">
	<meta property="og:image" content="${CONFIG.ipc.theaterServerUrl}/opengraph.jpg">

	<link rel="stylesheet" href="/styles/stage.css">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/1.0.4/css/bulma.min.css">
	<link rel="stylesheet" href="/styles/stage.css">
	<style>
		body {
			background-color: var(--channelle-main-bg-color);
			color: var(--channelle-main-text-color);
		}
		.container {
			text-align: center;
			max-width: 600px;
			padding: 2rem;
			margin: 0 auto;
		}
		strong {
			color: var(--channelle-main-text-color);
		}
	</style>
</head>
<body>
	<div class="container">
		<h1 class="title">${show.name}</h1>

		${show.description ? `<p class="description">${show.description}</p>` : ""}
		<br><br>
		<p>${show.nomenclature} har inte börjat ännu...</p>
		<p class="mt-2"><strong>du kan antagligen komma tillbaka hit om en liten stund</strong></p>

		<a href="${CONFIG.ipc.theaterServerUrl}" class="button is-large is-primary mt-6">Gå tillbaka till teatern</a>
		<br/>
		<a href="./" class="button is-large is-secondary mt-6">Ladda om sidan</a>
	</div>
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
