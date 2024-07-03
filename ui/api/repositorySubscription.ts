import type {
	OperationName,
	RepositoryName,
	RepositoryTypes,
} from './_databaseTypes';
import type { SubscriptionMessage } from './_connectionTypes';
import { Subscription } from './_subscription';
import { createSubscriptionPath } from '~/../shared';

export class RepositorySubscription<
	Name extends RepositoryName,
	Kind extends 'first' | 'all' = 'all',
	DataValue extends
		| (RepositoryTypes[Name]['Operations']['findFirst']['Result'] | null)
		| RepositoryTypes[Name]['Operations']['findMany']['Result'] = Kind extends 'first'
		? RepositoryTypes[Name]['Operations']['findFirst']['Result'] | null
		: RepositoryTypes[Name]['Operations']['findMany']['Result'],
> extends Subscription<{ data: DataValue }> {
	/** Message properties common for all communication */
	private readonly _defaultMessage: Pick<
		SubscriptionMessage,
		'repository' | 'id'
	>;

	/** Initial default value */
	private readonly _defaultValue: DataValue;

	/** Most recent updated value */
	private _value: DataValue;

	/** Response handler */
	private _handler: (data: DataValue) => Promise<void> | void = (
		data: DataValue
	) => {
		this._value = data || this._defaultValue;
		this.emit('data', this._value);
	};

	/** Returns the path for this repository subscription */
	public get path(): string {
		return createSubscriptionPath(this._defaultMessage);
	}

	/** Returns the most recent data, or default data for this repository subscription */
	public get data(): DataValue {
		return this._value || this._defaultValue;
	}

	private _listening: boolean = false;

	// Constructor

	constructor(defaultMessage: Pick<SubscriptionMessage, 'id' | 'repository'>) {
		super();
		this._defaultMessage = defaultMessage;
		this._defaultValue = this._defaultMessage.id ? null : ([] as any);
		this._value = this._defaultValue;
	}

	// Operations

	public async operate<
		Operation extends OperationName,
		Result extends RepositoryTypes[Name]['Operations'][Operation]['Result'],
	>(
		operation: Operation,
		args: RepositoryTypes[Name]['Operations'][Operation]['Args']
	): Promise<Result> {
		console.log(
			`[Repository Subscription] Performing operation "${operation}" on ${this.path}`
		);

		return new Promise<Result>((resolve, reject) => {
			const message: SubscriptionMessage<Name, Operation> = {
				messageId: `${Math.round(Math.random() * 1000)}`,
				repository: this._defaultMessage.repository,
				args,
			};
			Subscription.socketOnce(
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
			Subscription.socketEmit(operation, message);
		});
	}

	// Start / Stop

	public stop() {
		if (this._listening) {
			Subscription.socketOn(this.path, this._handler);
			Subscription.socketEmit('unsubscribe', this._defaultMessage);
			this._listening = false;
			this.off('data');
			console.log(
				`[Repository Subscription] Stopped listening to ${this.path}, all listeners removed`
			);
		}
	}

	public start() {
		if (this.listeners('data') < 1) {
			console.log(
				`[Repository Subscription] can't start a subscription to ${this.path} without listeners`
			);
		} else if (!this._listening) {
			Subscription.socketOn(this.path, this._handler);
			Subscription.socketEmit('subscribe', this._defaultMessage);
			this._listening = true;
			console.log(
				`[Repository Subscription] Started listening to updates at ${this.path}`
			);
		}
	}
}
