import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import Emittery from 'emittery'
import { createSubscriptionPath } from '~/../shared'
import type {
  OperationName,
  RepositoryName,
  RepositoryOperationTypes,
  RepositoryTypes,
} from './_databaseTypes'
import type {
  ConnectionStatusName,
  SubscriptionMessage,
} from './_connectionTypes'

export function createSubscription<Name extends RepositoryName>(
  repository: Name,
  id?: undefined
): Subscription<
  Name,
  RepositoryTypes[Name],
  Array<RepositoryTypes[Name]['ModelProjectionType']>
>
export function createSubscription<Name extends RepositoryName>(
  repository: Name,
  id?: RepositoryTypes[Name]['ModelIdType']
): Subscription<
  Name,
  RepositoryTypes[Name],
  RepositoryTypes[Name]['ModelProjectionType'] | undefined
>

export function createSubscription<Name extends RepositoryName>(
  repository: Name,
  id?: RepositoryTypes[Name]['ModelIdType']
) {
  // Create a subscription to a specific document
  if (id) {
    return new Subscription<
      Name,
      RepositoryTypes[Name],
      RepositoryTypes[Name]['ModelProjectionType'] | undefined
    >({ repository, id }, undefined)
  }

  // Create a subscription to all documents in the collection
  else {
    return new Subscription<
      Name,
      RepositoryTypes[Name],
      Array<RepositoryTypes[Name]['ModelProjectionType']>
    >({ repository }, [])
  }
}

export class Subscription<
  Name extends RepositoryName,
  Types extends RepositoryTypes[Name] = RepositoryTypes[Name],
  ResultValue extends
    | Types['ModelProjectionType']
    | Array<Types['ModelProjectionType']>
    | undefined =
    | Types['ModelProjectionType']
    | Array<Types['ModelProjectionType']>
    | undefined,
> {
  //#region static subscription fields
  private static _socket: Socket
  private static _connectionStatus: ConnectionStatusName = 'disconnected'
  public static _eventEmitter: Emittery = new Emittery() // NOTE: preferable not public

  private static setConnectionStatus(status: ConnectionStatusName) {
    this._connectionStatus = status
    console.log(`[SUBSCRIPTION] connection status: ${status}`)
    this._eventEmitter.emit('status', status)
  }

  private static getSocket(): Socket {
    if (!this._socket) {
      // Any cached customer id is sent when the clients socket is established for the first time
      this._socket = io()

      // When the socket is connected...
      this._socket.on('connect', () => {
        this.setConnectionStatus('connected')
      })
      this._socket.on('disconnect', () => {
        this.setConnectionStatus('disconnected')
      })
    }
    return this._socket
  }

  public static get status(): string {
    return Subscription._connectionStatus
  }

  public static connect(): void {
    this.getSocket()
  }
  //#endregion

  private readonly _baseMessage: Pick<SubscriptionMessage, 'repository' | 'id'>
  private readonly _defaultValue: ResultValue

  private _handler: (data: ResultValue) => Promise<void> | void
  private _eventEmitter: Emittery = new Emittery()
  private _listening: boolean
  private _value: ResultValue

  private onNewData(data: ResultValue) {
    this._value = data || this._defaultValue
    this._eventEmitter.emit('data', this._value)
  }

  // Emittance

  private emitEvent(event: string) {
    Subscription.getSocket().emit(event, this._baseMessage)
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
      }
      Subscription.getSocket().once(
        message.messageId,
        (response: { data: Result; ok: boolean; error?: string }) => {
          if (response.ok) {
            resolve(response.data)
          } else {
            console.log('[API]', response)
            reject(response.error)
          }
        }
      )
      Subscription.getSocket().emit(operation, message)
    })
  }

  public get path(): string {
    return createSubscriptionPath(this._baseMessage)
  }

  // Constructor

  constructor(
    details: Pick<SubscriptionMessage, 'id' | 'repository'>,
    defaultValue: ResultValue
  ) {
    this._baseMessage = details
    this._value = defaultValue
    this._defaultValue = defaultValue
    this._listening = false
    this._handler = this.onNewData.bind(this)
  }

  // Handlers

  public onData(handler: Subscription<Name, Types, ResultValue>['_handler']) {
    this._eventEmitter.on('data', handler)
  }

  public onStatus(
    handler: (status: ConnectionStatusName) => Promise<void> | void
  ) {
    Subscription._eventEmitter.on('status', handler)
  }

  // Operations

  public async operate<Operation extends OperationName>(
    operation: Operation,
    args: RepositoryOperationTypes<Name, Operation>['Args']
  ) {
    console.log(
      `[SUBSCRIPTION] ${this.path} :: ${operation}, listening for updates: ${this._listening}`
    )
    return this.emitOperation(operation, args)
  }

  public get(): ResultValue {
    return this._value || this._defaultValue
  }

  // Start / Stop

  public stop() {
    if (this._listening) {
      Subscription.getSocket().off(this.path, this._handler)
      this.emitEvent('unsubscribe')
      this._listening = false
      this._eventEmitter.clearListeners('data')
      console.log(
        `[SUBSCRIPTION] Stopped listening to ${this.path}, all onData events removed`
      )
    }
  }

  public start() {
    if (this._eventEmitter.listenerCount('data') == 0) {
      console.log(
        `[SUBSCRIPTION] can't start a subscription to ${this.path}, no events are registered`
      )
    } else if (!this._listening) {
      Subscription.getSocket().on(this.path, this._handler)
      this.emitEvent('subscribe')
      this._listening = true
      console.log(`[SUBSCRIPTION] Started listening to updates at ${this.path}`)
    }
  }
}
