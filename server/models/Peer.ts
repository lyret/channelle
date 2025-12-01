import Emittery from "emittery";
import { Model, DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

// Public event emitter for model updates
export const peerEmitter = new Emittery<{
	created: Peer;
	updated: Peer;
	onlineStatusChanged: Peer;
}>();

/** Peer model. */
export class Peer extends Model {
	declare showId: number | null;
	declare id: string;
	declare name: string;
	declare actor: boolean;
	declare manager: boolean;
	declare banned: boolean;
	declare audioMuted: boolean;
	declare videoMuted: boolean;
	declare online: boolean;

	declare createdAt: Date;
	declare updatedAt: Date;
}

/** Initialize the Peer model. */
export function initPeer(sequelize: Sequelize) {
	Peer.init(
		{
			id: {
				type: DataTypes.STRING,
				primaryKey: true,
				allowNull: false,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "",
			},
			actor: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			manager: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			banned: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			audioMuted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			videoMuted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			showId: {
				type: DataTypes.INTEGER,
				allowNull: true,
				// No foreign key constraint to allow -1 for global admin peers
				// -1 indicates the peer belongs to all shows (theater mode admins)
			},
		},
		{
			sequelize,
			modelName: "Peer",
			tableName: "Peer",
			timestamps: true,
		},
	);

	Peer.afterCreate(async (peer: Peer) => {
		await peerEmitter.emit("created", peer);
	});
	Peer.afterUpdate(async (peer: Peer) => {
		await peerEmitter.emit("updated", peer);
	});
}
