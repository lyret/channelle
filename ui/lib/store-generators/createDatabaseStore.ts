import type {
	RepositoryName,
	RepositoryTypes,
	SubscriptionMessage,
} from '~/lib';
import { readable } from 'svelte/store';
import { createSubscriptionPath } from '../../../shared';
import { ws } from '../api';

/** Store interface */
interface DatabaseStore<T> {
	/** Indicates that we are both connected and have a non-default value */
	isConnected: () => boolean;
	subscribe: (subscription: (value: T) => void) => () => void;
}

/** Creates a readable Svelte Store for all entries in the given database repository */
export function createDatabaseStore<Name extends RepositoryName>(
	name: Name,
	id?: undefined
): DatabaseStore<RepositoryTypes[Name]['Operations']['findMany']['Result']>;

/** Creates a readable Svelte Store for a specific row with id in the given database repository */
export function createDatabaseStore<Name extends RepositoryName>(
	name: Name,
	id?: RepositoryTypes[Name]['ModelIdType']
): DatabaseStore<RepositoryTypes[Name]['Operations']['findFirst']['Result']>;

// Function implementation
export function createDatabaseStore<
	Name extends RepositoryName,
	IdType extends RepositoryTypes[Name]['ModelIdType'] | undefined,
	Kind extends 'first' | 'all' = 'all',
	DataValue extends
		| (RepositoryTypes[Name]['Operations']['findFirst']['Result'] | null)
		| RepositoryTypes[Name]['Operations']['findMany']['Result'] = Kind extends 'first'
		? RepositoryTypes[Name]['Operations']['findFirst']['Result'] | null
		: RepositoryTypes[Name]['Operations']['findMany']['Result'],
>(
	repository: Name,
	id?: IdType
): DatabaseStore<
		IdType extends RepositoryTypes[Name]['ModelIdType']
			? RepositoryTypes[Name]['Operations']['findFirst' | 'findMany']['Result']
			: RepositoryTypes[Name]['Operations']['findMany']['Result']
	> {
	const _defaultMessage: Pick<SubscriptionMessage, 'id' | 'repository'> = {
		repository,
		id,
	};
	const subscriptionPath = createSubscriptionPath(_defaultMessage);
	const _socket = ws();
	let _isConnected = false;
	const _value = _defaultMessage.id ? null : ([] as any);

	const { subscribe } = readable(_value, function start(_set) {
		const _onConnect = () => {};
		_socket.on('connect', _onConnect);
		const _onDisconnect = () => {
			_isConnected = false;
		};
		_socket.on('disconnect', _onDisconnect);

		const _onData = (data: DataValue) => {
			_isConnected = true;
			_set(data);
		};
		_socket.on(subscriptionPath, _onData);

		// Start the subscription
		_socket.emit('subscribe', _defaultMessage);

		return function stop() {
			_socket.emit('unsubscribe', _defaultMessage);
			_socket.off('connect', _onConnect);
			_socket.off('disconnect', _onDisconnect);
			_socket.off(subscriptionPath, _onData);
		};
	});

	return {
		isConnected: () => _isConnected,
		subscribe,
	};
}
