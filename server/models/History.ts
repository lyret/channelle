import { Model, DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

/** History model - keeps statistics for a finished show */
export class History extends Model {
	declare id: number;
	declare showId: number;
	declare showName: string;
	declare showDescription: string;
	declare script: string | null;
	declare startedAt: Date;
	declare endedAt: Date;
	declare duration: number; // in minutes
	declare nrOfActors: number;
	declare nrOfVisitors: number;
	declare nrOfAdmins: number;
	declare createdAt: Date;
	declare updatedAt: Date;
}

/** Initialize the History model */
export function initHistory(sequelize: Sequelize) {
	History.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			showId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "Show",
					key: "id",
				},
			},
			showName: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			showDescription: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			script: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: null,
			},
			startedAt: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			endedAt: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			duration: {
				type: DataTypes.INTEGER,
				allowNull: false,
				comment: "Duration in minutes",
			},
			nrOfActors: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			nrOfVisitors: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			nrOfAdmins: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
		},
		{
			sequelize,
			modelName: "History",
			tableName: "History",
			timestamps: true,
		},
	);
}
