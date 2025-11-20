import type { Sequelize } from "sequelize";
import { Model, DataTypes } from "sequelize";

/** Message model. */
export class Message extends Model {
	declare id: number;
	declare message: string;
	declare backstage: boolean;
	declare peerId: string;
	declare peerName: string;
	declare showId: number | null;
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
			modelName: "Message",
			tableName: "Message",
			timestamps: true,
			updatedAt: false,
		},
	);
}
