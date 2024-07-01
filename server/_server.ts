import * as MediaSoup from 'mediasoup';
import * as Fs from 'fs/promises';
import * as Path from 'path';
import * as Http from 'http';
import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import ServeStatic from 'koa-static';
import * as IO from 'socket.io';
import { Repository } from '../database';
import { Config } from '../shared';
import { createMediaRepostiory } from './media';
import { createBundlerMiddleware } from './middlewares/createBundlerMiddleware';
import { createIOEventHandlers } from './middlewares/createIOEventHandlers';

/** The directory to use for builds */
const OUT_DIR = Path.resolve(process.cwd(), '.dist', 'ui');

async function SPAFallback(ctx: Koa.Context, next: Koa.Next) {
	let outFile = await Fs.readFile(Path.resolve(OUT_DIR, 'index.html'), {
		encoding: 'utf8',
	});

	outFile = outFile.replaceAll('_main', '/_main');
	outFile = outFile.replaceAll('style.css', '/style.css');

	ctx.status = 200;
	ctx.body = outFile;
	ctx.type = 'html';
	await next();
}

/**
 * Creates and starts the application server
 */
export async function createServer(): Promise<Http.Server> {
	console.log('[Config]', JSON.stringify(Config));
	console.log('[MS Server] media soup version', MediaSoup.version);

	// Create the server object
	const app = new Koa();

	// Parse bodies
	app.use(BodyParser({ enableTypes: ['text'] }));

	// Re-bundle the application GUI either once, or on each request when in development
	const bundlerMiddleware = await createBundlerMiddleware();
	if (!Config.isProduction) {
		app.use((ctx, next) => bundlerMiddleware(ctx, next));
	}

	// Serve static files
	app.use(ServeStatic(OUT_DIR));

	// Use the SPA Fallback
	app.use(SPAFallback);

	// FIXME: Singeltons are removed for now
	// ...from options file
	/** Where to store singleton information between runs  */
	//export const SINGLETON_PATH = (id: string) =>
	//    Path.resolve(process.cwd(), `.dist/singeltons/${id}`);
	// ...at same location
	// Add endpoints for singlepoints
	// createSingletonEndpoint(app, 'prompt', {
	//   title: '',
	//   body: '',
	//   dark: false,
	//   important: false,
	//   visible: false,
	// })
	// createSingletonEndpoint(app, 'highscore', {
	//   name: 'all-time',
	//   entries: [
	//     { name: 'ingen', points: 0 },
	//     { name: 'ingen', points: 0 },
	//     { name: 'ingen', points: 0 },
	//   ],
	// })
	// createSingletonEndpoint(app, 'session-highscore', {
	//   name: '',
	//   entries: [],
	// })

	// Listen for requests
	const http = app.listen(Config.web.port);
	const io = new IO.Server(http);

	// Initialize a media stream repository
	await createMediaRepostiory(io);

	// Connect repositories with IO
	Repository.setIO(io);

	// Handle websocket events
	io.on('connection', createIOEventHandlers);

	// Return the http server
	return http;
}
