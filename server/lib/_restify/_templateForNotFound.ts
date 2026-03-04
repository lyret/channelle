import type Restify from "restify";
/**
 * HTML template for 404 not found pages
 * Uses template literals for static content
 */
export function getNotFoundTemplate(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Channelle - Hittades inte</title>
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
	</style>
</head>
<body>
	<div class="container">
		<h1 class="title is-1">Sidan hittades inte</h1>
		<p class="has-text-white mt-6">Sidan du öppnade finns inte längre, eller så har den aldrig funnits.</p>
		<a href="${CONFIG.ipc.theaterServerUrl}" class="button is-large is-primary mt-6">Gå tillbaka till teatern</a>
	</div>
</body>
</html>`;
}

/**
 * Restify Route for sending the template
 */
export function NotFoundTemplateMiddleware(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
	const html = getNotFoundTemplate();
	res.writeHead(200, {
		"Content-Length": Buffer.byteLength(html),
		"Content-Type": "text/html; charset=utf-8",
	});
	res.write(html);
	res.end();
	return next();
}
