import { Model, DataTypes, Sequelize } from "sequelize";

/** Scene model. */
export class Scene extends Model {
	declare id: number;
	declare order: number;
	declare layout: string;
}

/** Initialize the Scene model. */
export function initScene(sequelize: Sequelize) {
	Scene.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			order: {
				type: DataTypes.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			layout: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: "Scene",
			tableName: "Scene",
			timestamps: false,
		},
	);
}
