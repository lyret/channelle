import type { Prisma } from '@prisma/client';
import type {
	RepositoryName,
	OperationName,
	RepositoryTypes,
} from './_databaseTypes';
import { RepositorySubscription } from './repositorySubscription';

async function performOperation<
	Name extends RepositoryName,
	Operation extends OperationName,
>(
	repository: Name,
	operation: Operation,
	args: Prisma.Args<RepositoryTypes[Name]['ModelType'], Operation>
): Promise<RepositoryTypes[Name]['Operations'][Operation]['Result']> {
	const subscription = new RepositorySubscription<Name, 'all'>({ repository });

	return await subscription.operate(operation, args);
}

export async function findOne<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryTypes[Name]['Operations']['findFirst']['Args']
) {
	return performOperation(repository, 'findFirst', args);
}

export async function create<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryTypes[Name]['Operations']['create']['Args']
) {
	return performOperation(repository, 'create', args);
}

export async function update<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryTypes[Name]['Operations']['update']['Args']
) {
	return performOperation(repository, 'update', args);
}

export async function remove<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryTypes[Name]['Operations']['delete']['Args']
) {
	return performOperation(repository, 'delete', args);
}
