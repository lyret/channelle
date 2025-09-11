// import * as MediaSoup from "mediasoup";
import type * as Http from "http";

//import { createIOEventHandlers } from "./createIOEventHandlers";
// import { loadStores } from "./loadStores";
import { http, sequelize, ws } from "./lib/api";

// import * as SceneStores from "./stores/scene";
// import * as UserStores from "./stores/users";
// import * as MediaStores from "./stores/media";
// import * as StageStores from "./stores/stage";
// import { keepProducersAndConsumersUpdated } from "./mediaSync";
// import { roomRouter } from "./room/room";

/**
 * Creates and starts the application server
 */
export async function createServer(): Promise<Http.Server> {
	// Create the http server
	const httpServer = await http();

	// Create the socket server
	ws();

	// Create the database connection
	await sequelize();

	// // Load stores so that they are not removed from the server bundle
	// loadStores(
	// 	SceneStores.sceneChatIsEnabled,
	// 	SceneStores.sceneCurtains,
	// 	SceneStores.sceneEffectsIsEnabled,
	// 	StageStores.stageLayout,
	// 	StageStores.selectedPredefinedStageLayout,
	// 	SceneStores.scenePassword,
	// 	SceneStores.sceneVisitorAudioIsEnabled,
	// 	MediaStores.audioProducers,
	// 	MediaStores.videoProducers,
	// 	MediaStores.mediaProducerTransports,
	// 	MediaStores.mediaReceiverTransports,
	// 	UserStores.userCameraBans,
	// 	UserStores.userMicrophoneBans,
	// 	UserStores.userOnlineStatus
	// );

	// // Keep media in sync
	// keepProducersAndConsumersUpdated();

	// Connect repositories with IO
	//Repository.setIO(io);

	// Handle websocket events
	//io.on("connection", createIOEventHandlers);

	// Start the server
	httpServer.listen(CONFIG.web.port);
	console.log(`[Server] HTTP server listening on port ${CONFIG.web.port}`);

	// Return the http server
	return httpServer;
}
