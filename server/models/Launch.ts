import { Model, DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

/** Launch model - represents a launched instance of a show */
export class Launch extends Model {
	declare id: number;
	declare showId: number;
	declare instanceId: string;
	declare url: string | null;
	declare proxyUrl: string | null;
	declare port: number | null;
	declare status: "starting" | "running" | "stopping" | "stopped" | "error";
	declare stoppedAt: Date | null;
	declare createdAt: Date;
	declare updatedAt: Date;

	// Virtual field for online status
	declare online: boolean;
}

/** Initialize the Launch model */
export function initLaunch(sequelize: Sequelize) {
	Launch.init(
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
			instanceId: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
				defaultValue: DataTypes.UUIDV4, // Let database generate UUID if not provided
			},
			url: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: null,
			},
			proxyUrl: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: null,
			},
			port: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: null,
			},
			status: {
				type: DataTypes.ENUM("starting", "running", "stopping", "stopped", "error"),
				allowNull: false,
				defaultValue: "starting",
			},
			stoppedAt: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: null,
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
			modelName: "Launch",
			tableName: "Launch",
			timestamps: true,
		},
	);

	// Add virtual field for online status
	Launch.addHook("afterInit", (launch) => {
		Object.defineProperty(launch, "online", {
			get() {
				return this.status === "running" || this.status === "starting";
			},
		});
	});
}
