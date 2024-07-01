import * as SocketIO from 'socket.io';
import { Prisma } from '@prisma/client';
import { client, Client } from './_client';

/** Possible repository database operations */
export const RepositoryOperations = [
	'findFirst',
	'findMany',
	'create',
	'update',
	'delete',
] as const;

/** Possible repository database operations that modifies the database */
export const RepositoryOperationsThatIntroducesChanges = [
	'create',
	'update',
	'delete',
];

/** Repository implementation */
export class Repository<
	ModelName extends Prisma.ModelName = Prisma.ModelName,
	ModelType extends Client[Lowercase<ModelName>] = Client[Lowercase<ModelName>],
	ModelProjectionType = Prisma.Result<
		Client[Lowercase<ModelName>],
		{},
		'findFirstOrThrow'
	>,
	ModelIdField extends keyof ModelProjectionType = keyof ModelProjectionType,
	ModelIdType = ModelProjectionType[ModelIdField],
> {
	// Public members for types
	public readonly __ModelName: ModelName;
	public readonly __ModelType: ModelType;
	public readonly __ModelIdField: ModelIdField;
	public readonly __ModelProjectionType: ModelProjectionType;
	public readonly __ModelIdType: ModelIdType;

	// Private fields
	private _modelName: ModelName;
	private _repoName: Lowercase<ModelName>;
	private _modelIdField: ModelIdField;
	private _model: ModelType;

	// Shared IO server between all repositories

	private static _io: SocketIO.Server;

	protected get io(): SocketIO.Server {
		if (!Repository._io) {
			throw new Error('No IO Server exists!');
		}
		return Repository._io;
	}

	public static setIO(io: SocketIO.Server): void {
		this._io = io;
	}

	// Shared collection of all created repositories
	public static _allRepositories: {
		[key: string]: Repository<any, any, any, any>;
	} = {};

	// Constructor

	constructor(key: ModelName, idField: ModelIdField) {
		this._modelName = key;
		this._repoName = this._modelName.toLowerCase() as Lowercase<ModelName>;
		this._modelIdField = idField;
		this._model = client[key.toLowerCase()];
		Repository._allRepositories[key.toLowerCase()] = this;
	}

	// Emittance

	public async emitAll(socket?: SocketIO.Socket) {
		const path = `/${this._repoName}`;
		const target = socket ? socket.id : path;
		const data = await this.operate('findMany', {} as any);
		console.log(
			`[${this._modelName.toUpperCase()}] Emitting all documents to`,
			target
		);
		this.io.to(target).emit(path, data);
	}

	public async emitOne(id: ModelIdType, socket?: SocketIO.Socket) {
		const path = `/${this._repoName}/${id}`;
		const target = socket ? socket.id : path;

		const data = await this.operate('findFirst', {
			where: { [this._modelIdField]: id },
		} as any);

		if (data) {
			console.log(
				`[${this._modelName.toUpperCase()}] Emitting one document to`,
				target
			);
			this.io.to(target).emit(path, data);
		} else {
			console.log(
				`[${this._modelName.toUpperCase()}] Emitting that the document with id ${id} is missing or deleted to`,
				target
			);
			this.io.to(target).emit(path, undefined);
		}
	}

	// CRUD Operations
	// NOTE: the typings for Prisma.Args gives type warnings inside the repository implementation
	// but works as expected otherwise

	public async operate<Operation extends (typeof RepositoryOperations)[number]>(
		operation: Operation,
		args: Prisma.Args<ModelType, Operation>
	) {
		try {
			const result = await (this._model[operation] as any)(args);

			return result;
		} catch (error) {
			console.error(
				`[${this._modelName.toUpperCase()}] Operation error: ${error}`
			);
			return undefined;
		}
	}
}
