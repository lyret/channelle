import { RepositorySubscription } from '~/lib';
import type { DataTypes } from '~/lib';
import type { Socket } from 'socket.io-client';
import { derived, readable } from 'svelte/store';
import { ws } from '../api';

/** The API store holds the context information needed to determine connection and participation status */
export const APIStore = createAPIStore();

/** Gives the current participant if available from the API or throws  */
export const currentParticipant = derived([APIStore], ([$APIStore]) => {
	if ($APIStore.status == 'ready') {
		return $APIStore.participant;
	}
	throw new Error(
		'Tried to access the current participant when API was unready'
	);
});

/** Creates a Svelte Store from a local subscription */
function createAPIStore(): APIStore {
	const _socket: Socket = ws('/');
	let _participantSubscription:
		| RepositorySubscription<'participant', 'first'>
		| undefined;

	let cookiesAccepted = !!localStorage.getItem('cookies-accepted');
	let participantId = localStorage.getItem('participant-id')
		? Number(localStorage.getItem('participant-id'))
		: undefined;
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
				participantId,
				(response: { ok: boolean; participant: DataTypes['participant'] }) => {
					if (!response?.ok) {
						console.error('Failed to registred existing participantion');
						_set({
							status: 'error',
							hasError: true,
							isReady: false,
							errorMessage: 'Failed to registred existing participantion',
						});
					} else {
						// Store the current participants id in local storage
						localStorage.setItem(
							'participant-id',
							String(response.participant.id)
						);

						// Create a subscription to the current participants data in the database
						_participantSubscription = new RepositorySubscription({
							repository: 'participant',
							id: response.participant.id,
						});

						// Load any initial data
						_onParticipantData(response.participant);

						// Start the subscription
						_participantSubscription.on('data', _onParticipantData);
						_participantSubscription.start();
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
			_participantSubscription?.off('data', _onParticipantData);
		};
	});

	return {
		get: () => _value,
		subscribe,
	};
}

/** Returns the web socket used for all subscriptions, initiates a connection when needed */

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

/** API Store interface */
type APIStore = {
	get: () => APIStoreValue;
	subscribe: (handler: (value: APIStoreValue) => void) => () => void;
};