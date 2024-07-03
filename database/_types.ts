import type { Prisma } from '@prisma/client';
import type { RepositoryOperations } from './_repository';
import type { Repositories } from './_repositories';

/** A name of any available repository */
export type RepositoryName = keyof typeof Repositories;

/**
 * A mapping between the available data repositories and their relevant database types from prisma
 * used for mapping repositories to socket and get type safety on the client side
 */
export type RepositoryTypes = {
	[Name in RepositoryName]: {
		ModelName: (typeof Repositories)[Name]['__ModelName'];
		ModelType: (typeof Repositories)[Name]['__ModelType'];
		ModelIdField: (typeof Repositories)[Name]['__ModelIdField'];
		ModelProjectionType: (typeof Repositories)[Name]['__ModelProjectionType'];
		ModelIdType: (typeof Repositories)[Name]['__ModelIdType'];
		Operations: {
			[Operation in (typeof RepositoryOperations)[number]]: {
				Operation: Operation;
				Args: Prisma.Args<
					(typeof Repositories)[Name]['__ModelType'],
					Operation
				>;
				Result: Prisma.Result<
					(typeof Repositories)[Name]['__ModelType'],
					Prisma.Args<(typeof Repositories)[Name]['__ModelType'], Operation>,
					Operation
				>;
			};
		};
	};
};

/** Any possible database model data type */
export type DataTypes = {
	[Name in RepositoryName]: (typeof Repositories)[Name]['__ModelProjectionType'];
};

/** Any name of a possible operation */
export type OperationName = (typeof RepositoryOperations)[number];
