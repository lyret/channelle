import Koa from "koa";
import BodyParser from "koa-bodyparser";

let _app: Koa | undefined;

/** Returns the global koa application  */
export function koa(): Koa {
	// Return already initialized singelton instance
	if (_app) {
		return _app;
	}

	// Create and return the application instance
	_app = new Koa();

	// Parse bodies
	_app.use(BodyParser({ enableTypes: ["text"] }));

	return _app;
}
