import type Restify from "restify";
/**
 * HTML template for non-active stage pages
 * Uses template literals for static content
 */
export function getNonActiveStageTemplate(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>En tom scen - Channelle</title>
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
		<h1 class="title">Ingenting på scenen</h1>
		<p>Det verkar inte vara någon aktivitet på den här scenen just nu, antagligen har här varit en föreställning eller så kommer det snart att vara än, i så fall</p>
		<p class="mt-2"><strong>kan du antagligen komma tillbaka hit om en liten stund</strong></p>
		<a href="${CONFIG.ipc.theaterServerUrl}" class="button is-large is-primary mt-6">Gå tillbaka till teatern</a>
		<br/>
		<a href="./" class="button is-large is-secondary mt-6">Ladda om sidan</a>
	</div>
</body>
</html>`;
}

/**
 * Restify Route for sending the template
 */
export function NonActiveStageTemplateMiddleware(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
	const html = getNonActiveStageTemplate();
	res.writeHead(200, {
		"Content-Length": Buffer.byteLength(html),
		"Content-Type": "text/html; charset=utf-8",
	});
	res.write(html);
	res.end();
	return next();
}
