import * as Path from "node:path";
import { Sequelize } from "sequelize";
import { initPeer, Peer } from "../models/Peer";
import { initMessage, Message } from "../models/Message";
import { initScene } from "../models/Scene";
import { initShow, Show } from "../models/Show";

let _sequelize: Sequelize | undefined;

/** Returns the global database connection manager  */
export async function sequelize(): Promise<Sequelize> {
	// Return already initialized singelton instance
	if (_sequelize) {
		return _sequelize;
	}

	// Set up the database path in the .dist directory
	const dbPath = Path.join(process.cwd(), ".dist", "database", `${CONFIG.runtime.slug}${!CONFIG.runtime.production ? "-dev" : ""}.sqlite`);

	// Create Sequelize instance
	_sequelize = new Sequelize({
		dialect: "sqlite",
		storage: dbPath,
		logging: CONFIG.runtime.verbose ? console.log : false,
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
	initShow(_sequelize);

	// Set up model associations after all models are initialized
	setupModelAssociations();

	// Sync all models with the database
	await _sequelize.sync();

	console.log("[Database] Connection has been established successfully.");
	return _sequelize;
}

/**
 * Set up all model associations after models are initialized
 */
function setupModelAssociations() {
	// Peer <-> Show associations
	Peer.belongsTo(Show, {
		foreignKey: "showId",
		targetKey: "id",
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
		as: "show",
	});
	Show.hasMany(Peer, {
		foreignKey: "showId",
		sourceKey: "id",
		as: "peers",
	});

	// Message <-> Peer associations
	Message.belongsTo(Peer, {
		foreignKey: "peerId",
		targetKey: "id",
		onDelete: "SET NULL",
		onUpdate: "CASCADE",
		as: "peer",
	});
	Peer.hasMany(Message, {
		foreignKey: "peerId",
		sourceKey: "id",
		as: "messages",
	});

	// Message <-> Show associations
	Message.belongsTo(Show, {
		foreignKey: "showId",
		targetKey: "id",
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
		as: "show",
	});
	Show.hasMany(Message, {
		foreignKey: "showId",
		sourceKey: "id",
		as: "messages",
	});
}
