import { Model, DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";
import type { Scene, SceneSetting } from "../_types";

/** Show model. */
export class Show extends Model {
	declare id: number;
	declare name: string;
	declare description: string;
	declare nomenclature: string;
	declare showPassword: string;
	declare curtainsOverride: SceneSetting;
	declare chatEnabledOverride: SceneSetting;
	declare effectsEnabledOverride: SceneSetting;
	declare visitorAudioEnabledOverride: SceneSetting;
	declare visitorVideoEnabledOverride: SceneSetting;
	declare currentScene: Scene | null;
	declare createdAt: Date;
	declare updatedAt: Date;
}

/** Initialize the Show model. */
export function initShow(sequelize: Sequelize) {
	Show.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notEmpty: true,
					len: [1, 255],
				},
			},
			description: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: "",
			},
			nomenclature: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "föreställningen",
				validate: {
					notEmpty: true,
					len: [1, 100],
				},
			},
			showPassword: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "",
			},
			curtainsOverride: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0, // SceneSetting.AUTOMATIC
			},
			chatEnabledOverride: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0, // SceneSetting.AUTOMATIC
			},
			effectsEnabledOverride: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0, // SceneSetting.AUTOMATIC
			},
			visitorAudioEnabledOverride: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0, // SceneSetting.AUTOMATIC
			},
			visitorVideoEnabledOverride: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0, // SceneSetting.AUTOMATIC
			},
			currentScene: {
				type: DataTypes.JSON,
				allowNull: true,
				defaultValue: null,
			},
		},
		{
			sequelize,
			modelName: "Show",
			tableName: "Show",
			timestamps: true,
		},
	);
}
