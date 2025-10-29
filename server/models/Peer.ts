import { Model, DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

/** Peer model. */
export class Peer extends Model {
	declare id: string;
	declare joinTs: number;
	declare lastSeenTs: number;
	declare online: boolean;
	declare name: string;
	declare actor: boolean;
	declare manager: boolean;
	declare banned: boolean;
	declare audioMuted: boolean;
	declare videoMuted: boolean;
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
			joinTs: {
				type: DataTypes.BIGINT,
				allowNull: false,
				defaultValue: () => Date.now(),
			},
			lastSeenTs: {
				type: DataTypes.BIGINT,
				allowNull: false,
				defaultValue: () => Date.now(),
			},
			online: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
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
		},
		{
			sequelize,
			modelName: "Peer",
			tableName: "Peer",
			timestamps: true,
		},
	);
}
