import * as Restify from "restify";
import RestifyErrors from "restify-errors";

/**
 * Rejects requests whose path cannot be safely handed to the filesystem.
 * Restify's serveStatic passes decodeURIComponent(req.path()) straight to fs.stat,
 * which throws synchronously on null bytes (and decoding throws on malformed escapes),
 * crashing the whole server process.
 * @param server - The Restify server instance
 */
export function rejectInvalidPaths(server: Restify.Server): void {
	server.pre((req, res, next) => {
		let decodedPath: string;
		try {
			decodedPath = decodeURIComponent(req.path());
		} catch {
			return next(new RestifyErrors.BadRequestError("Malformed request path"));
		}

		if (decodedPath.includes("\0")) {
			return next(new RestifyErrors.BadRequestError("Invalid request path"));
		}

		return next();
	});
}
