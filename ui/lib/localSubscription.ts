import Emittery from 'emittery';

export function createLocalSubscription<Value>(
	key: string,
	defaultValue: Value
) {
	return new LocalStorageSubscription(key, defaultValue);
}

class LocalStorageSubscription<Value = any> {
	private static _eventEmitter: Emittery = new Emittery();
	private readonly _key: string;
	private readonly _defaultValue: Value;
	private _listening: boolean;
	private _handler: undefined | ((value: Value) => Promise<void> | void);
	private _windowHandler:
		| undefined
		| ((event: StorageEvent) => Promise<void> | void);

	constructor(key: string, defaultValue: Value) {
		this._key = key;
		this._defaultValue = defaultValue;
		this._listening = false;
	}

	public get(): Value {
		const item = window.localStorage.getItem(this._key);
		return item ? (JSON.parse(item) as Value) : this._defaultValue;
	}

	public set(value: Value | undefined) {
		if (!value) {
			window.localStorage.removeItem(this._key);
		} else {
			window.localStorage.setItem(this._key, JSON.stringify(value));
		}
		LocalStorageSubscription._eventEmitter.emit(this._key, value);
	}

	public onData(handler: (value: Value) => Promise<void> | void) {
		this._handler &&
			LocalStorageSubscription._eventEmitter.off(this._key, this._handler);
		this._windowHandler &&
			window.removeEventListener('storage', this._windowHandler);

		// Register event handler when using the subscription api
		this._handler = handler.bind(this);

		// Register event handler for changes from the web-inspector or other pages
		this._windowHandler = (event) => {
			if (event.key == this._key) {
				const newValue = event.newValue
					? (JSON.parse(event.newValue) as Value)
					: this._defaultValue;
				this._handler!(newValue);
			}
		};

		if (this._listening) {
			LocalStorageSubscription._eventEmitter.on(this._key, this._handler);
		}
	}

	public stop() {
		if (this._listening) {
			this._handler &&
				LocalStorageSubscription._eventEmitter.off(this._key, this._handler);
			this._windowHandler &&
				window.removeEventListener('storage', this._windowHandler);
			this._listening = false;
			console.log(
				`[LS] Stopped listening to ${this._key}, all onData events removed`
			);
		}
	}

	public start() {
		if (!this._handler || !this._windowHandler) {
			console.log(
				`[LS] can't start a local subscription to ${this._key}, no onData event is registered`
			);
		} else if (!this._listening) {
			// Handle changes using the subscription
			LocalStorageSubscription._eventEmitter.on(this._key, this._handler);

			// Handle changes to local storages from the web-inspector or other pages
			window.addEventListener('storage', this._windowHandler);

			this._listening = true;
			const existingItem = window.localStorage.getItem(this._key);
			LocalStorageSubscription._eventEmitter.emit(
				this._key,
				existingItem ? (JSON.parse(existingItem) as Value) : this._defaultValue
			);
			console.log(`[LS] Started listening to updates at ${this._key}`);
		}
	}
}
