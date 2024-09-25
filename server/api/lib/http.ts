import { koa } from './koa';
import type { Server } from 'http';

let _http: Server | undefined;

/** Returns the global node http server  */
export function http(): Server {
	// Return already initialized singelton instance
	if (_http) {
		return _http;
	}

	// Get the koa application
	const _app = koa();

	// Create and return the http server
	_http = _app.listen(CONFIG.web.port);

	return _http;
}
