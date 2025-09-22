import { Model, DataTypes, Sequelize } from "sequelize";

/** Participant model. */
export class Participant extends Model {
	declare id: number;
	declare createdAt: Date;
	declare updatedAt: Date;
	declare name: string;
	declare blocked: boolean;
	declare actor: boolean;
	declare manager: boolean;
}

/** Initialize the Participant model. */
export function initParticipant(sequelize: Sequelize) {
	Participant.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			blocked: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
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
		},
		{
			sequelize,
			modelName: "Participant",
			tableName: "Participant",
			timestamps: true,
		},
	);
}
