import type { Sequelize } from "sequelize";
import { Model, DataTypes } from "sequelize";
import { Peer } from "./Peer";

/** Message model. */
export class Message extends Model {
	declare id: number;
	declare message: string;
	declare backstage: boolean;
	declare peerId: string;
	declare peerName: string;
	declare createdAt: Date;
}

/** Initialize the Message model. */
export function initMessage(sequelize: Sequelize) {
	Message.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			message: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			backstage: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			peerId: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			peerName: {
				type: DataTypes.STRING,
				defaultValue: "",
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: "Message",
			tableName: "Message",
			timestamps: true,
			updatedAt: false,
		},
	);

	// Define association with Peer
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
}
