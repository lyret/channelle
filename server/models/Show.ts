import { Model, DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";
import type { Scene, SceneSetting } from "../_types";

/** Show model. */
export class Show extends Model {
	declare id: number;
	declare name: string;
	declare description: string;
	declare nomenclature: string;
	declare password: string;
	declare selectedScene: Scene | null;
	declare curtainsOverride: SceneSetting;
	declare chatEnabledOverride: SceneSetting;
	declare gratitudeEffectsEnabledOverride: SceneSetting;
	declare criticalEffectsEnabledOverride: SceneSetting;
	declare visitorAudioEnabledOverride: SceneSetting;
	declare visitorVideoEnabledOverride: SceneSetting;
	declare url: string | null;
	declare online: boolean;
	declare nrOfTimesRehersed: number;
	declare nrOfTimesShown: number;
	declare createdAt: Date;
	declare updatedAt: Date;
	declare lastOnlineAt: Date | null;
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
			password: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "",
			},
			url: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: null,
			},
			nrOfTimesRehersed: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			nrOfTimesShown: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
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
			gratitudeEffectsEnabledOverride: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0, // SceneSetting.AUTOMATIC
			},
			criticalEffectsEnabledOverride: {
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
			selectedScene: {
				type: DataTypes.JSON,
				allowNull: true,
				defaultValue: null,
			},
			lastOnlineAt: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: null,
			},
			online: {
				type: DataTypes.VIRTUAL,
				get() {
					return this.url !== null;
				},
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
