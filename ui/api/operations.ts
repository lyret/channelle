import type {
	RepositoryName,
	OperationName,
	RepositoryOperationTypes,
	RepositoryTypes,
} from './_databaseTypes';
import { Subscription } from './socketSubscription';

async function performOperation<
	Name extends RepositoryName,
	Operation extends OperationName,
>(
	repository: Name,
	operation: Operation,
	args: RepositoryOperationTypes<Name, Operation>['Args']
): Promise<RepositoryOperationTypes<Name, Operation>['Result']> {
	const subscription = new Subscription<
		Name,
		RepositoryTypes[Name],
		Array<RepositoryTypes[Name]['ModelProjectionType']>
	>({ repository }, []);

	return await subscription.operate(operation, args);
}

export async function findOne<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryOperationTypes<Name, 'findFirst'>['Args']
) {
	return performOperation(repository, 'findFirst', args);
}

export async function create<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryOperationTypes<Name, 'create'>['Args']
) {
	return performOperation(repository, 'create', args);
}

export async function update<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryOperationTypes<Name, 'update'>['Args']
) {
	return performOperation(repository, 'update', args);
}

export async function remove<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryOperationTypes<Name, 'delete'>['Args']
) {
	return performOperation(repository, 'delete', args);
}
