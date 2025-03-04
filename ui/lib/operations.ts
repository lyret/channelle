import type { Prisma } from '@prisma/client';
import type {
	RepositoryName,
	OperationName,
	RepositoryTypes,
} from './_databaseTypes';
import {
	createSubscriptionPath,
	type MediaRequests,
	type SubscriptionMessage,
} from '../../shared';
import { ws } from './api';

async function performDBOperation<
	Name extends RepositoryName,
	Operation extends OperationName,
	Result extends
	RepositoryTypes[Name]['Operations'][Operation]['Result'] = RepositoryTypes[Name]['Operations'][Operation]['Result'],
>(
	repository: Name,
	operation: Operation,
	args: Prisma.Args<RepositoryTypes[Name]['ModelType'], Operation>
): Promise<RepositoryTypes[Name]['Operations'][Operation]['Result']> {
	const socket = ws();
	const path = createSubscriptionPath({ repository });
	console.log(`[DB] Performing operation "${operation}" on ${path}`);

	return new Promise<Result>((resolve, reject) => {
		const message: SubscriptionMessage<Name, Operation> = {
			messageId: `${Math.round(Math.random() * 1000)}`,
			repository,
			args,
		};
		socket.once(
			message.messageId,
			(response: { data: Result; ok: boolean; error?: string }) => {
				if (response.ok) {
					resolve(response.data);
				} else {
					console.log('[Repository Subscription] Response', response);
					reject(response.error);
				}
			}
		);
		socket.emit(operation, message);
	});
}

/* TODO: Depricated! */
/** Sends a media request through the socket connection and returns the response from the server */
export async function mediaRequest<Type extends keyof MediaRequests>(
	type: Type,
	data?: MediaRequests[Type][0]
) {
	return new Promise<MediaRequests[Type][1]>((resolve, reject) => {
		console.log('[WS] requesting', type);
		const socket = ws();
		socket.emit(
			type,
			data || {},
			(response: (MediaRequests[Type][1] & { error: unknown }) | undefined) => {
				if (response && response.error) {
					console.error('[WS]', type, 'Error:');
					console.error(response.error);
					reject(response.error);
				} else {
					resolve(response as MediaRequests[Type][1]);
				}
			}
		);
	});
}

export async function findOne<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryTypes[Name]['Operations']['findFirst']['Args']
) {
	return performDBOperation(repository, 'findFirst', args);
}

export async function create<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryTypes[Name]['Operations']['create']['Args']
) {
	return performDBOperation(repository, 'create', args);
}

export async function update<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryTypes[Name]['Operations']['update']['Args']
) {
	return performDBOperation(repository, 'update', args);
}

export async function remove<Name extends RepositoryName>(
	repository: Name,
	args: RepositoryTypes[Name]['Operations']['delete']['Args']
) {
	return performDBOperation(repository, 'delete', args);
}
