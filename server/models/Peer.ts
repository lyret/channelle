import { Model, DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

/** Peer model. */
export class Peer extends Model {
	declare id: string;
	declare joinTs: number;
	declare lastSeenTs: number;
	declare name: string;
	declare actor: boolean;
	declare manager: boolean;
	declare banned: boolean;
	declare audioMuted: boolean;
	declare videoMuted: boolean;
	declare showId: number | null;

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
				references: {
					model: "Show",
					key: "id",
				},
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
