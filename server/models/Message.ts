import { Model, DataTypes, Sequelize } from "sequelize";
import { Participant } from "./Participant";

/** Message model. */
export class Message extends Model {
	declare id: number;
	declare backstage: boolean;
	declare createdAt: Date;
	declare participantId: number;
	declare message: string;
	declare author: string;
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
			backstage: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
			participantId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			message: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			author: {
				type: DataTypes.STRING,
				defaultValue: "",
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: "Message",
			tableName: "Message",
			timestamps: false,
		},
	);

	// Define association with Participant
	Message.belongsTo(Participant, {
		foreignKey: "participantId",
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	});
	Participant.hasMany(Message, {
		foreignKey: "participantId",
		as: "messages",
	});
}
