import * as Path from "node:path";
import { Sequelize } from "sequelize";
import { initPeer } from "../models/Peer";
import { initMessage } from "../models/Message";
import { initScene } from "../models/Scene";
import { initStage } from "../models/Stage";
import { seedStages } from "./seedStages";

let _sequelize: Sequelize | undefined;

/** Returns the global database connection manager  */
export async function sequelize(): Promise<Sequelize> {
	// Return already initialized singelton instance
	if (_sequelize) {
		return _sequelize;
	}

	// Set up the database path in the .dist directory
	const dbPath = Path.join(process.cwd(), ".dist", "database", `${CONFIG.stage.id}${!CONFIG.isProduction ? "-dev" : ""}.sqlite`);

	// Create Sequelize instance
	_sequelize = new Sequelize({
		dialect: "sqlite",
		storage: dbPath,
		logging: CONFIG.debug.verboseOutput ? console.log : false,
		define: {
			timestamps: true,
		},
	});

	// Authenticate
	await _sequelize.authenticate();

	// initialize models
	initPeer(_sequelize);
	initMessage(_sequelize);
	initScene(_sequelize);
	initStage(_sequelize);

	// Sync all models with the database
	await _sequelize.sync();

	// Seed initial data
	await seedStages();

	console.log("[Database] Connection has been established successfully.");
	return _sequelize;
}
