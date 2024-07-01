import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import Emittery from 'emittery';
import { Config } from '~/../shared';
import type { DataTypes } from './_databaseTypes';
import type { ConnectionStatusName } from './_connectionTypes';

export class Subscription {
	private static _socket: Socket;
	private static _connectionStatus: ConnectionStatusName = 'disconnected';
	public static _eventEmitter: Emittery = new Emittery(); // NOTE: preferable not public

	private static setConnectionStatus(status: ConnectionStatusName) {
		this._connectionStatus = status;
		console.log(`[SUBSCRIPTION] connection status: ${status}`);
		this._eventEmitter.emit('status', status);
	}

	protected static getSocket(): Socket {
		if (!this._socket) {
			const { url, path, transports } = Config.socket;
			this._socket = io(url, {
				path,
				transports,
			});

			// When the socket is connected...
			this._socket.on('connect', () => {
				this.setConnectionStatus('connected');
				if (localStorage.getItem('participant-id')) {
					Subscription.registerParticipation();
				}
			});
			this._socket.on('disconnect', () => {
				this.setConnectionStatus('disconnected');
			});
		}
		return this._socket;
	}

	protected static getEmitter(): Emittery {
		return this._eventEmitter;
	}

	public static registerParticipation() {
		Subscription.getSocket().emit(
			'registerParticipant',
			localStorage.getItem('participant-id')
		);
		this._socket.once(
			'registerParticipant',
			(response: {
				ok: boolean;
				data: DataTypes['participant'];
				error?: string;
			}) => {
				if (response.ok) {
					console.log('[SUBSCRIPTION] registered existing participantion');
				} else {
					console.log(
						'[SUBSCRIPTION] failed to registered existing participantion'
					);
				}
			}
		);
	}

	public static get status(): ConnectionStatusName {
		return Subscription._connectionStatus;
	}

	public static connect(): void {
		this.getSocket();
	}

	// Emittance

	protected static emit(event: string, ...args: any[]) {
		Subscription.getSocket().emit(event, ...args);
	}
}
