import EventEmitter from "node:events";
import { ws } from "../api";
import { attempt } from "../utils/attempt";

/** Creates a new observable store for a single value */
export function createValueStore<V>(
	identifier: string,
	defaultValue: V
): ObservableValueStore<V> {
	const _identifier = identifier;
	const _io = ws().of(`/${identifier}`);
	const _emitter: EventEmitter<{ [P in keyof OVEvents<V>]: any }> =
		new EventEmitter();

	let _value: V = defaultValue;

	// Create a method for emitting the value when its updated
	const _emit = () => {
		_emitter.emit("*", _value);
		_io.emit("*", _value);
	};

	// Handle incomming web socket events from the client
	_io.on("connection", (_socket) => {
		_socket.on("set", (value: V) => {
			_value = value;
			_emit();
		});
		_socket.on("refresh", (callback) => {
			callback(_value);
		});
	});

	return {
		key: _identifier,
		set: (value: V) => {
			_value = value;
			_emit();
		},
		get: () => {
			return _value;
		},
		subscribe: (handler: (value: V) => any) => {
			_emitter.on("*", handler);
			attempt(handler)(_value);
			return () => {
				_emitter.off("*", handler);
			};
		},
	};
}

/** Observable Value Store Interface */
export type ObservableValueStore<V> = {
	/** Returns the key for this observable map, unique for server<->client communication */
	key: string;
	/** Sets the given value */
	set: (value: V) => void;
	/** Returns the current value */
	get: () => V;
	/** Subscribe to updates to the value, retuns the unsubscibe function */
	subscribe: (handler: (data: V) => any) => () => void;
};

/** Events emitted within the observable value store */
export type OVEvents<V> = {
	"*": V;
};
