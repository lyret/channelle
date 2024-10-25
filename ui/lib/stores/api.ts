import type { DataTypes, SubscriptionMessage } from '~/lib';
import type { Socket } from 'socket.io-client';
import { derived, readable } from 'svelte/store';
import { ws } from '../api';
import { createSubscriptionPath } from '../../../shared';

/** The API store holds the context information needed to determine connection and participation status */
export const APIStore = createAPIStore();

/** Gives the current participant if available from the API or an empty participant when unavailable  */
export const currentParticipant = derived([APIStore], ([$APIStore]) => {
	if ($APIStore.status == 'ready') {
		return $APIStore.participant;
	}
	return {
		id: -1,
		actor: false,
		blocked: false,
		manager: false,
		name: '',
	} as DataTypes['participant'];
});

/** Creates a Svelte Store from a local subscription */
function createAPIStore(): APIStore {
	const _socket: Socket = ws();

	let cookiesAccepted = !!localStorage.getItem('cookies-accepted');
	let participantId = localStorage.getItem('participant-id')
		? Number(localStorage.getItem('participant-id'))
		: undefined;
	let participantSubscriptionPath: string | undefined;
	let participantSubscriptionMessage:
		| Omit<SubscriptionMessage, 'messageId'>
		| undefined;
	let _value: APIStoreValue = !_socket.connected
		? {
				status: 'disconnected',
				cookiesAccepted,
				isReady: false,
				isConnected: false,
			}
		: {
				status: 'connected',
				cookiesAccepted,
				isReady: false,
				isConnected: true,
			};

	const { subscribe } = readable<APIStoreValue>(_value, function start(_set) {
		// Handle new participant data
		let _onParticipantData = (participant: DataTypes['participant'] | null) => {
			if (!participant) {
				return _set({
					status: 'error',
					isReady: false,
					hasError: true,
					errorMessage: 'Nu participant data found in database',
				});
			}
			if (participant.blocked) {
				return _set({
					status: 'blocked',
					isReady: true,
				});
			}
			_set({
				status: 'ready',
				cookiesAccepted,
				isReady: true,
				isConnected: true,
				participant: participant,
				participantId: participant.id,
			});
		};

		// Handle connections
		let _onConnect = () => {
			_value = {
				status: 'connected',
				cookiesAccepted,
				isReady: false,
				isConnected: true,
			};
			_set(_value);

			// Register a participant on the server side API
			// Either with the existing id stored in local storage or,
			// if not set - as a new participant
			_socket.emit(
				'registerParticipant',
				{ participantId },
				(response: { ok: boolean; participant: DataTypes['participant'] }) => {
					if (!response?.ok) {
						console.error('Failed to registred existing participantion');
						_set({
							status: 'error',
							hasError: true,
							isReady: false,
							errorMessage: 'Failed to registred existing participantion',
						});
						// FIXME: quick fix
						localStorage.removeItem('participant-id');
						window.location.reload();
					} else {
						// Store the current participants id in local storage
						localStorage.setItem(
							'participant-id',
							String(response.participant.id)
						);

						// Create a subscription to the current participants data in the database
						participantSubscriptionMessage = {
							repository: 'participant',
							id: response.participant.id,
						};
						participantSubscriptionPath = createSubscriptionPath(
							participantSubscriptionMessage
						);

						// Load any initial data
						_onParticipantData(response.participant);

						// Start the subscription
						_socket.on(participantSubscriptionPath, _onParticipantData);
						_socket.emit('subscribe', participantSubscriptionMessage);
					}
				}
			);
		};
		_socket.on('connect', _onConnect);

		// Handle disconnections
		let _onDisconnect = () => {
			_value = {
				status: 'disconnected',
				cookiesAccepted,
				isReady: false,
				isConnected: false,
			};
			_set(_value);
		};
		_socket.on('disconnect', _onDisconnect);

		// Handle debugging events
		if (CONFIG.runtime.debug) {
			// Reload the browser when requested by the server
			_socket.on('build-event', (buildOutputs: any) => {
				// Reload the window
				window.location.reload();

				// TODO: Only reload CSS code if possible, requries some more tinkering
				// to get working
				// for (const link of Array.from(document.querySelectorAll('link'))) {
				// 	const url = new URL(link.href);
				// 	for (const outputPath of Object.keys(buildOutputs)) {
				// 		if (
				// 			url.host === location.host &&
				// 			`${CONFIG.build.clientOutput}${url.pathname}` == outputPath
				// 		) {
				// 			// Create a new link element for the css, load it and delete
				// 			// the previous link element
				// 			const nextHref = outputPath.split('/').splice(-1)[0];
				// 			console.log(nextHref);
				// 			const nextElement = link.cloneNode() as HTMLLinkElement;
				// 			nextElement.href =
				// 				nextHref + ('?' + Math.random().toString(36).slice(2));
				// 			nextElement.onload = () => link.remove();
				// 			link.parentNode?.insertBefore(nextElement, link.nextSibling);
				// 			return;
				// 		}
				// 	}
				// }
			});
		}

		// Connect
		_socket.connect();

		// Return stop function
		return function stop() {
			_socket.off('connect', _onConnect);
			_socket.off('disconnect', _onDisconnect);
			if (participantSubscriptionMessage) {
				_socket.off(participantSubscriptionPath, _onParticipantData);
				_socket.emit('unsubscribe', participantSubscriptionMessage);
			}
		};
	});

	return {
		get: () => _value,
		subscribe,
	};
}

/** API Store Value */
type APIStoreValue =
	| {
			/** Current API status */
			status: 'error';
			/** Indicates if the API is connected and ready */
			isReady: false;
			/** The API has crashed due to an error */
			hasError: true;
			/** The textual desciption of the error message */
			errorMessage: string;
	  }
	| {
			/** Current API status */
			status: 'blocked';
			/** Indicates if the API is connected and ready */
			isReady: true;
	  }
	| {
			/** Current API status */
			status: 'disconnected';
			/** Indicates if the API is connected and ready */
			isReady: false;
			/** The Websocket connection status */
			isConnected: false;
			/** Indicates that cookies are either accepted or denied/unknown */
			cookiesAccepted: boolean;
	  }
	| {
			/** Current API status */
			status: 'connected';
			/** Indicates if the API is connected and ready */
			isReady: false;
			/** The Websocket connection status */
			isConnected: true;
			/** Indicates that cookies are either accepted or denied/unknown */
			cookiesAccepted: boolean;
	  }
	| {
			/** Current API status */
			status: 'ready';
			/** Indicates if the API is connected and ready */
			isReady: true;
			/** The Websocket connection status */
			isConnected: true;
			/** Indicates that cookies are either accepted or denied/unknown */
			cookiesAccepted: boolean;
			/** Current participant id */
			participantId: number;
			/** Current participant */
			participant: DataTypes['participant'];
	  };

/** API Store Interface */
type APIStore = {
	get: () => APIStoreValue;
	subscribe: (handler: (value: APIStoreValue) => void) => () => void;
};
