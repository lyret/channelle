import { Model, DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

/** Stage model. */
export class Stage extends Model {
	declare id: number;
	declare name: string;
	declare description: string;
	declare stagePassword: string;
	declare createdAt: Date;
	declare updatedAt: Date;
}

/** Initialize the Stage model. */
export function initStage(sequelize: Sequelize) {
	Stage.init(
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
			stagePassword: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "",
			},
		},
		{
			sequelize,
			modelName: "Stage",
			tableName: "Stage",
			timestamps: true,
		},
	);
}
