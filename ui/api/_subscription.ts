//@ts-ignore
import { io } from 'socket.io-client';
import Emittery from 'emittery';
import type { DataTypes } from './_databaseTypes';
import type { ConnectionStatusName } from './_connectionTypes';

type SubscriptionSocketEvents = {
	status: ConnectionStatusName;
};
export class Subscription<
	Events extends Record<string, unknown> = Record<string, unknown>,
> {
	private static _connectionStatus: ConnectionStatusName = 'disconnected';
	private static _socket: SocketIO.Socket;
	private static _subscriptionEventEmitter: Emittery<SubscriptionSocketEvents> =
		new Emittery();
	private _instanceEventEmitter: Emittery<Events> = new Emittery();

	/** Sets the connection status manually */
	private static set status(status: ConnectionStatusName) {
		this._connectionStatus = status;
		console.log(`[Subscription] connection status: ${status}`);
		this.subscriptionEmit('status', status);
	}

	/** Returns the current connection status */
	public static get status(): ConnectionStatusName {
		return Subscription._connectionStatus;
	}

	/** Returns the web socket used for all subscriptions, initiates a connection when needed */
	public static connection(): SocketIO.Socket {
		// FIXME: should not be public
		if (!this._socket) {
			const { url, path, transports } = CONFIG.socket;
			this._socket = io(url, {
				path,
				transports,
			});

			// When the socket is connected...
			this._socket.on('connect', () => {
				this.status = 'connected';
				if (localStorage.getItem('participant-id')) {
					Subscription.registerParticipation();
				}
			});
			this._socket.on('disconnect', () => {
				this.status = 'disconnected';
			});

			// Add debugging events
			if (CONFIG.runtime.debug) {
				// Reload the browser when requested by the server
				this._socket.on('build-event', (buildOutputs) => {
					// Reload the window
					window.location.reload();

					// TODO: Only reload CSS code if possible, requries some more tinkering
					// to get working
					for (const link of Array.from(document.querySelectorAll('link'))) {
						const url = new URL(link.href);
						for (const outputPath of Object.keys(buildOutputs)) {
							if (
								url.host === location.host &&
								`${CONFIG.build.clientOutput}${url.pathname}` == outputPath
							) {
								// Create a new link element for the css, load it and delete
								// the previous link element
								const nextHref = outputPath.split('/').splice(-1)[0];
								console.log(nextHref);
								const nextElement = link.cloneNode() as HTMLLinkElement;
								nextElement.href =
									nextHref + ('?' + Math.random().toString(36).slice(2));
								nextElement.onload = () => link.remove();
								link.parentNode?.insertBefore(nextElement, link.nextSibling);
								return;
							}
						}
					}
				});
			}
		}
		return this._socket;
	}

	// Socket Emittance

	protected static socketEmit(event: string, ...args: any[]) {
		Subscription.connection().emit(event, ...args);
	}

	protected static socketOn(
		event: string,
		handler: (response: any) => void | Promise<void>
	) {
		Subscription.connection().on(event, handler);
	}

	protected static socketOff(
		event: string,
		handler: (response: any) => void | Promise<void>
	) {
		Subscription.connection().off(event, handler);
	}

	protected static socketOnce(
		event: string,
		handler: (response: any) => void | Promise<void>
	) {
		Subscription.connection().once(event, handler);
	}

	// Subscription Emittance

	public static subscriptionEmit<Key extends keyof SubscriptionSocketEvents>(
		event: Key,
		data: SubscriptionSocketEvents[Key]
	) {
		this._subscriptionEventEmitter.emit(event, data);
	}

	public static subscriptionOn<Key extends keyof SubscriptionSocketEvents>(
		event: Key,
		handler: (data: SubscriptionSocketEvents[Key]) => void | Promise<void>
	) {
		this._subscriptionEventEmitter.on(event, handler);
	}

	public static subscriptionOff<Key extends keyof SubscriptionSocketEvents>(
		event: Key,
		handler: (data: SubscriptionSocketEvents[Key]) => void | Promise<void>
	) {
		this._subscriptionEventEmitter.off(event, handler);
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

	// Static Methods

	/** Connects to the server side API */
	public static connect(): void {
		this.connection();
	}

	/** Registers a participant on the server side API */
	public static registerParticipation() {
		Subscription.connection().emit(
			'registerParticipant',
			localStorage.getItem('participant-id')
		);
		Subscription.connection().once(
			'registerParticipant',
			(response: {
				ok: boolean;
				data: DataTypes['participant'];
				error?: string;
			}) => {
				if (response.ok) {
					console.log('[Subscription] registered existing participantion');
				} else {
					console.log(
						'[Subscription] failed to registered existing participantion'
					);
				}
			}
		);
	}
}
