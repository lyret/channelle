import Emittery from 'emittery';
import type { Socket } from 'socket.io-client';
import { ws } from './api';

type SubscriptionSocketEvents = {
	status: string;
};
export class Subscription<
	Events extends Record<string, unknown> = Record<string, unknown>,
> {
	private static _connectionStatus: string = 'disconnected';
	private static _subscriptionEventEmitter: Emittery<SubscriptionSocketEvents> =
		new Emittery();
	private _instanceEventEmitter: Emittery<Events> = new Emittery();

	protected static socketOn(
		event: string,
		handler: (response: any) => void | Promise<void>
	) {
		ws().on(event, handler);
	}

	protected static socketOff(
		event: string,
		handler: (response: any) => void | Promise<void>
	) {
		ws().off(event, handler);
	}

	protected static socketOnce(
		event: string,
		handler: (response: any) => void | Promise<void>
	) {
		ws().once(event, handler);
	}

	// Subscription Emittance

	public static subscriptionEmit<Key extends keyof SubscriptionSocketEvents>(
		event: Key,
		data: SubscriptionSocketEvents[Key]
	) {
		this._subscriptionEventEmitter.emit(event, data);
	}

	// Instance Emittance

	protected emit<Key extends keyof Events>(event: Key, data: Events[Key]) {
		this._instanceEventEmitter.emit(event, data);
	}

	public listeners<Key extends keyof Events>(event: Key): number {
		return this._instanceEventEmitter.listenerCount(event);
	}

	/** Registers a new event listener from this subscription instance */
	public on<Key extends keyof Events>(
		event: Key,
		handler: (data: Events[Key]) => void | Promise<void>
	) {
		this._instanceEventEmitter.on(event, handler);
	}

	/** Removes an existing event listener from this subscription instance */
	public off<Key extends keyof Events>(
		event: Key,
		handler?: (data: Events[Key]) => void | Promise<void>
	) {
		if (!handler) {
			this._instanceEventEmitter.clearListeners(event);
		} else {
			this._instanceEventEmitter.off(event, handler);
		}
	}
}
