import * as Restify from "restify";
import { getIpcStatus, endCurrentShow, rebuildWithNewShow } from "./_ipcMangement";

/**
 * Creates the IPC endpoints for a stage server for communications from the theater server
 * @param server The Restify server instance.
 */
export function setupIpcEndpoints(server: Restify.Server): void {
	// Middleware to validate IPC secret
	const validateIpcSecret = (req: Restify.Request, res: Restify.Response, next: Restify.Next) => {
		const authHeader = req.header("Authorization");
		const secret = req.query?.secret || req.body?.secret;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.substring(7);
			if (token === CONFIG.ipc.secret) {
				return next();
			}
		} else if (secret === CONFIG.ipc.secret) {
			return next();
		}

		res.send(401, {
			error: "Unauthorized",
			message: "Invalid or missing IPC secret",
		});
		next(false);
	};

	// Theater IPC command endpoints

	// Endpoint to get the stage and show status
	server.get("/api/theater/status", validateIpcSecret, (req, res, next) => {
		const status = getIpcStatus();
		res.send(200, status);
		return next();
	});

	// Ends the current showing of the selected show
	server.post("/api/theater/end", validateIpcSecret, (req, res, next) => {
		endCurrentShow()
			.then(() => {
				res.send(200, { end: true });
				return next();
			})
			.catch((error) => {
				console.error("[IPC] Error ending show:", error);
				res.send(500, { error: "Failed to end show" });
				return next();
			});
	});

	// Rebuilds the stage server with the given show selected
	server.post("/api/theater/start", validateIpcSecret, (req, res, next) => {
		const { showId } = req.body;

		if (!showId) {
			res.send(400, { error: "Missing required show information" });
			return next();
		}

		rebuildWithNewShow(showId)
			.then((success) => {
				res.send(200, { rebuild: success });
				return next();
			})
			.catch((error) => {
				console.error("[IPC] Error rebuilding with new show:", error);
				res.send(500, { error: "Failed to rebuild with new show" });
				return next();
			});
	});
}
