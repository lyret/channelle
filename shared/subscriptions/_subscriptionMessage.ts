import type {
	RepositoryName,
	RepositoryTypes,
	OperationName,
} from '../../database';

/**
 * Subscription messages
 * passed between server and client through
 * socket.io, the event determines what action is taken
 */
export interface SubscriptionMessage<
	Name extends RepositoryName = RepositoryName,
	Operation extends OperationName = OperationName,
> {
	/** A generated identifier for this message, for returning a response */
	messageId: string;

	/** The data repository of interest */
	repository: RepositoryName;

	/** any specific data id this message is relevant for */
	id?: RepositoryTypes[Name]['ModelIdType'];

	/** Any arguments passed along the message */
	args?: RepositoryTypes[Name]['Operations'][Operation]['Args'];
}
