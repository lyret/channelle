import Emittery from 'emittery';
import { createSubscriptionPath } from '~/../shared';
import type {
  OperationName,
  RepositoryName,
  RepositoryOperationTypes,
  RepositoryTypes,
} from './_databaseTypes';
import type {
  ConnectionStatusName,
  SubscriptionMessage,
} from './_connectionTypes';
import { Subscription } from './_subscription';

export function createSocketSubscription<Name extends RepositoryName>(
  repository: Name,
  id?: undefined,
  args?: RepositoryOperationTypes<Name, 'findMany'>['Args']
): SocketSubscription<
  Name,
  RepositoryTypes[Name],
  RepositoryOperationTypes<Name, 'findMany'>['Result']
>;
export function createSocketSubscription<Name extends RepositoryName>(
  repository: Name,
  id?: RepositoryTypes[Name]['ModelIdType'],
  args?: RepositoryOperationTypes<Name, 'findFirst'>['Args']
): SocketSubscription<
  Name,
  RepositoryTypes[Name],
  RepositoryOperationTypes<Name, 'findFirst'>['Result']
>;

export function createSocketSubscription<Name extends RepositoryName>(
  repository: Name,
  id?: RepositoryTypes[Name]['ModelIdType'] | undefined,
  args?: RepositoryOperationTypes<Name, 'findFirst' | 'findMany'>['Args']
) {
  // Create a subscription to a specific document
  if (id) {
    return new SocketSubscription<
      Name,
      RepositoryTypes[Name],
      RepositoryOperationTypes<Name, 'findFirst'>['Result'] | null
    >({ repository, id, args }, null);
  }

  // Create a subscription to all documents in the collection
  else {
    return new SocketSubscription<
      Name,
      RepositoryTypes[Name],
      RepositoryOperationTypes<Name, 'findMany'>['Result']
    >({ repository, args }, [] as any);
  }
}

export class SocketSubscription<
  Name extends RepositoryName,
  Types extends RepositoryTypes[Name] = RepositoryTypes[Name],
  ResultValue extends
    | (RepositoryOperationTypes<Name, 'findFirst'>['Result'] | null)
    | RepositoryOperationTypes<Name, 'findMany'>['Result'] =
    | (RepositoryOperationTypes<Name, 'findFirst'>['Result'] | null)
    | RepositoryOperationTypes<Name, 'findMany'>['Result'],
> extends Subscription {
  private readonly _baseMessage: Pick<SubscriptionMessage, 'repository' | 'id'>;
  private readonly _defaultValue: ResultValue;

  private _handler: (data: ResultValue) => Promise<void> | void;
  private _eventEmitter: Emittery = new Emittery();
  private _listening: boolean;
  private _value: ResultValue;

  private onNewData(data: ResultValue) {
    this._value = data || this._defaultValue;
    this._eventEmitter.emit('data', this._value);
  }

  private emitOperation<
    Operation extends OperationName,
    Result extends RepositoryOperationTypes<Name, Operation>['Result'],
  >(
    operation: Operation,
    args: RepositoryOperationTypes<Name, Operation>['Args']
  ): Promise<Result> {
    return new Promise<Result>((resolve, reject) => {
      const message: SubscriptionMessage<Name, Operation> = {
        messageId: `${Math.round(Math.random() * 1000)}`,
        repository: this._baseMessage.repository,
        args,
      };
      Subscription.getSocket().once(
        message.messageId,
        (response: { data: Result; ok: boolean; error?: string }) => {
          if (response.ok) {
            resolve(response.data);
          } else {
            console.log('[API]', response);
            reject(response.error);
          }
        }
      );
      Subscription.getSocket().emit(operation, message);
    });
  }

  public get path(): string {
    return createSubscriptionPath(this._baseMessage);
  }

  // Constructor

  constructor(
    details: Pick<SubscriptionMessage, 'id' | 'repository' | 'args'>,
    defaultValue: ResultValue
  ) {
    super();
    this._baseMessage = details;
    this._value = defaultValue;
    this._defaultValue = defaultValue;
    this._listening = false;
    this._handler = this.onNewData.bind(this);
  }

  // Handlers

  public onData(
    handler: SocketSubscription<Name, Types, ResultValue>['_handler']
  ) {
    this._eventEmitter.on('data', handler);
  }

  public onStatus(
    handler: (status: ConnectionStatusName) => Promise<void> | void
  ) {
    Subscription._eventEmitter.on('status', handler);
  }

  // Operations

  public async operate<Operation extends OperationName>(
    operation: Operation,
    args: RepositoryOperationTypes<Name, Operation>['Args']
  ) {
    console.log(
      `[SUBSCRIPTION] ${this.path} :: ${operation}, listening for updates: ${this._listening}`
    );
    return this.emitOperation(operation, args);
  }

  public get(): ResultValue {
    return this._value || this._defaultValue;
  }

  // Start / Stop

  public stop() {
    if (this._listening) {
      Subscription.getSocket().off(this.path, this._handler);
      Subscription.emit('unsubscribe');
      this._listening = false;
      this._eventEmitter.clearListeners('data');
      console.log(
        `[SUBSCRIPTION] Stopped listening to ${this.path}, all onData events removed`
      );
    }
  }

  public start() {
    if (this._eventEmitter.listenerCount('data') == 0) {
      console.log(
        `[SUBSCRIPTION] can't start a subscription to ${this.path}, no events are registered`
      );
    } else if (!this._listening) {
      Subscription.getSocket().on(this.path, this._handler);
      Subscription.emit('subscribe');
      this._listening = true;
      console.log(
        `[SUBSCRIPTION] Started listening to updates at ${this.path}`
      );
    }
  }
}
