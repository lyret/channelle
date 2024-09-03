import { BroadcastChannel } from 'broadcast-channel';
import * as MediaSoup from 'mediasoup';
import * as Fs from 'fs/promises';
import * as Path from 'path';
import * as Http from 'http';
import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import ServeStatic from 'koa-static';
import * as IO from 'socket.io';
import { Repository } from '../database';
import { createMediaRepostiory } from './media';
import { createIOEventHandlers } from './middlewares/createIOEventHandlers';

/**
 * Read and sends the index.html file
 */
async function ClientAccessMiddleware(ctx: Koa.Context, next: Koa.Next) {
	let outFile = await Fs.readFile(
		Path.resolve(process.cwd(), CONFIG.build.clientOutput, 'index.html'),
		{
			encoding: 'utf8',
		}
	);
	// outFile = outFile.replaceAll('_main', '/_main');
	// outFile = outFile.replaceAll('style.css', '/style.css');

	ctx.status = 200;
	ctx.body = outFile;
	ctx.type = 'html';
	await next();
}

/**
 * Creates and starts the application server
 */
export async function createServer(): Promise<Http.Server> {
	console.log('[MS Server] media soup version', MediaSoup.version);

	// Create the server object
	const app = new Koa();

	// Parse bodies
	app.use(BodyParser({ enableTypes: ['text'] }));

	// Serve static files
	app.use(ServeStatic(Path.resolve(process.cwd(), CONFIG.build.clientOutput)));

	// Serve the client interface
	app.use(ClientAccessMiddleware);

	// Listen for requests
	const http = app.listen(CONFIG.web.port);
	const io = new IO.Server(http, {
		serveClient: false,
		path: CONFIG.socket.path,
	});

	// Initialize a media stream repository
	await createMediaRepostiory(io);

	// Connect repositories with IO
	Repository.setIO(io);

	// Handle websocket events
	io.on('connection', createIOEventHandlers);

	// Handle incomming debugging messages from the cli over ipc
	if (CONFIG.runtime.debug) {
		const channel = new BroadcastChannel<{ type: 'build-event'; data: any }>(
			`cli-channel`
		);
		channel.addEventListener('message', ({ type, data }) => {
			switch (type) {
				// Refresh the connected clients
				case 'build-event':
					console.log('HERE!!', data);
					io.emit('build-event', data);
					break;
				// Unhandled messages
				default:
					console.log(
						`[DEBUG] Received unhandled ipc message of type: ${type}`
					);
					break;
			}
		});
	}

	// Return the http server
	return http;
}
