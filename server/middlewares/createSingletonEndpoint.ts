import Koa from 'koa';
import Router from 'koa-router';
import * as FS from 'fs';
import { SINGLETON_PATH } from '../options';
import type {
	SingletonDocuments,
	SingletonName,
} from '../../shared/singeltons';

/**
 * Generates a Koa Middleware
 * that rebundles and reloads the
 * front-end ui when changed, with server side rendering
 */
export const createSingletonEndpoint = async <
	Name extends SingletonName,
	Document extends SingletonDocuments[SingletonName],
>(
	app: Koa,
	name: Name,
	defaultData: Document
) => {
	// Create a router for the endpoints
	const router = new Router();

	// Create the data object in memory and determine the path
	let data: undefined | string = JSON.stringify(defaultData);
	const path = SINGLETON_PATH(name);

	// Read the current stored data, if any
	try {
		if (FS.existsSync(path)) {
			data = FS.readFileSync(path, { encoding: 'utf-8' });
		}
	} catch (err) {
		console.error(
			`[${name.toUpperCase()}] ERROR READING DATA ON STARTUP:`,
			err
		);
		data = JSON.stringify(defaultData);
	}

	// Create an API endpoint for replacing the current singleton data
	router.post(`/api/v1/${name}`, async (ctx) => {
		try {
			FS.writeFileSync(path, ctx.request.body, { encoding: 'utf-8' });
			data = ctx.request.body;
		} catch (err) {
			console.error(`[${name.toUpperCase()}] POST ERROR /api/v1/${name}:`, err);
		}
	});

	// Create an API endpoint for fetching the current singleton
	router.get(`/api/v1/${name}`, async (ctx) => {
		try {
			ctx.body = data;
		} catch (err) {
			console.error(`[${name.toUpperCase()}] GET ERROR /api/v1/${name}:`, err);
		}
	});

	// Add the new router to the app
	app.use(router.routes()).use(router.allowedMethods());
};
