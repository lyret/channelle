import type * as MediaSoup from 'mediasoup-client';
import { userCameraBans, userMicrophoneBans } from '~/stores/users';
import { derived, writable } from 'svelte/store';
import { rtcSendTransport } from '../api';
import { currentParticipant } from './api';
import { stageLayout } from '~/stores/stage/stageLayout';
import { sceneVisitorAudioIsEnabled } from '~/stores/scene/sceneVisitorAudioIsEnabled';

/** Local Media Devices Store Value */
type StoreValue = {
	video: {
		list: Array<MediaDeviceInfo>;
		selected?: MediaDeviceInfo;
		stream?: MediaStream;
		wanted?: boolean;
		blocked?: boolean;
		paused?: boolean;
		err?: string;
	};
	audio: {
		list: Array<MediaDeviceInfo>;
		selected?: MediaDeviceInfo;
		stream?: MediaStream;
		wanted?: boolean;
		blocked?: boolean;
		paused?: boolean;
		err?: string;
	};
};

/** Creates a Svelte Store for accessing the devices local media input-device information and media streams */
const createLocalMediaDevicesStores = () => {
	// A single call to getUserMedia is needed in Safari to get access to the correct lists, if we already
	// have made the call it will be ignored in the future
	let _hasCalledGetUserMedia: boolean = false;

	// MediaSoup producer for when the video stream is being transmitted to the server
	let _videoProducer: MediaSoup.types.Producer | undefined = undefined;
	// MediaSoup producer for when the audio stream is being transmitted to the server
	let _audioProducer: MediaSoup.types.Producer | undefined = undefined;

	// Internal value
	const _value: StoreValue = {
		video: {
			list: [],
			paused: true,
			selected: localStorage.getItem('selected-video-device')
				? JSON.parse(localStorage.getItem('selected-video-device')!)
				: undefined,
		},
		audio: {
			list: [],
			paused: true,
			selected: localStorage.getItem('selected-audio-device')
				? JSON.parse(localStorage.getItem('selected-audio-device')!)
				: undefined,
		},
	};

	// Create a derived store for determining if the current users camera / mic is banned
	const _remoteBannedStatusStore = derived(
		[currentParticipant, userCameraBans, userMicrophoneBans],
		([$currentParticipant, $userCameraBans, $userMicrophoneBans]) => {
			if ($currentParticipant) {
				return {
					cameraBan: $userCameraBans[$currentParticipant.id],
					micBan: $userMicrophoneBans[$currentParticipant.id],
				};
			}
			return {
				cameraBan: false,
				micBan: false,
			};
		}
	);

	// Create a derived store for determining if the current users audio / video is wanted on stage
	const _remoteWantedStatusStore = derived(
		[currentParticipant, stageLayout, sceneVisitorAudioIsEnabled],
		([$currentParticipant, $layout, $sceneVisitorAudioIsEnabled]) => {
			// Actor
			if ($currentParticipant.actor || $currentParticipant.manager) {
				// Auto layout
				if (
					!$layout ||
					!$layout.length ||
					($layout.length == 1 && !$layout[0].length)
				) {
					return {
						videoWanted: true,
						audioWanted: true,
					};
				}
				// Custom scene layout
				for (const row of $layout) {
					for (const cell of row) {
						if (cell.type == 'actor' && cell.id == $currentParticipant.id) {
							return {
								videoWanted: true,
								audioWanted: true,
							};
						}
					}
				}
			}

			// Visitor or actor not on stage
			return {
				videoWanted: false,
				audioWanted: $sceneVisitorAudioIsEnabled,
			};
		}
	);

	// Create an internal store for subscription handling
	const { subscribe, set } = writable<StoreValue>(_value, (set) => {
		// Handle updates to list of hardware input devices
		navigator.mediaDevices.addEventListener(
			'devicechange',
			onDeviceStatusChange
		);

		// Listen for remote user video and auido stage requests
		const stopRemoveWantedSubscription = _remoteWantedStatusStore.subscribe(
			({ videoWanted, audioWanted }) => {
				_value.video.wanted = videoWanted;
				_value.audio.wanted = audioWanted;
				_onUpdateVideo();
				_onUpdateAudio();
				set(_value);
			}
		);

		// Listen for remote user camera and microphone bans
		const stopRemoveBannedSubscription = _remoteBannedStatusStore.subscribe(
			({ cameraBan, micBan }) => {
				_value.video.blocked = cameraBan;
				_value.audio.blocked = micBan;
				_onUpdateVideo();
				_onUpdateAudio();
				set(_value);
			}
		);

		return function stop() {
			navigator.mediaDevices.removeEventListener(
				'devicechange',
				onDeviceStatusChange
			);
			stopRemoveBannedSubscription();
		};
	});

	const _onUpdateLists = async () => {
		try {
			const deviceInfos = await navigator.mediaDevices.enumerateDevices();

			_value.video.list = deviceInfos
				.filter((deviceInfo) => deviceInfo.kind === 'videoinput')
				.sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
			_value.audio.list = deviceInfos
				.filter((deviceInfo) => deviceInfo.kind === 'audioinput')
				.sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
		} catch (err) {
			console.error(err);
		}
	};

	const _onUpdateVideo = async () => {
		// Remove any error messages
		if (_value.video.err) {
			_value.video.err = undefined;
		}
		// Update the current stream if able and needed
		if (!_value.video.paused && !_value.video.blocked && !_value.video.stream) {
			try {
				_value.video.stream = await navigator.mediaDevices.getUserMedia({
					video: _value.video.selected
						? { deviceId: { exact: _value.video.selected.deviceId } }
						: true,
				});
				_hasCalledGetUserMedia = true;
			} catch (err: any) {
				console.error('Failed to get a local video media stream');
				console.error(err);

				_value.video.stream = undefined;
				if (
					err?.name == 'NotFoundError' ||
					err?.name == 'OverconstrainedError' ||
					err?.name == 'DevicesNotFoundError'
				) {
					_value.video.err = 'saknas';
				} else {
					_value.video.err = 'okänt fel';
				}
			}
		}

		// Update the video producer
		if (_videoProducer) {
			// Close and the delete the producer if no local media stream exists or the user is blocked
			if (!_value.video.stream || _value.video.blocked) {
				_value.video.stream = undefined;
				_value.video.paused = true;
				_videoProducer.close();
				_videoProducer = undefined;
				return;
			}

			// Check if the current stream has changed and update the video track in the producer
			const track = _value.video.stream.getVideoTracks()[0];
			if (_videoProducer.track?.id != track.id) {
				_videoProducer.track?.stop();
				await _videoProducer.replaceTrack({ track });
			}

			// Pause and resume any ongoing stream as needed
			if (_value.video.paused && _value.video.stream) {
				_videoProducer.pause();
			} else {
				_videoProducer.resume();
			}
		}
		// Create a new producer and add the existing track if possible
		else if (
			_value.video.stream &&
			!_value.video.paused &&
			!_value.video.blocked
		) {
			// Get the rtc send transport for publishing
			const sendTransport = await rtcSendTransport();

			// Get the current video track
			const track = _value.video.stream.getVideoTracks()[0];

			// Produce
			_videoProducer = await sendTransport.produce({ track });
		}
	};

	const _onUpdateAudio = async () => {
		// Remove any error messages
		if (_value.audio.err) {
			_value.audio.err = undefined;
		}
		// Update the current stream
		if (!_value.audio.paused && !_value.audio.blocked && !_value.audio.stream) {
			try {
				_value.audio.stream = await navigator.mediaDevices.getUserMedia({
					audio: _value.audio.selected
						? { deviceId: { exact: _value.audio.selected.deviceId } }
						: true,
				});
				_hasCalledGetUserMedia = true;
			} catch (err: any) {
				console.error('Failed to get a local audio media stream');
				console.error(err);

				_value.audio.stream = undefined;
				if (
					err?.name == 'NotFoundError' ||
					err?.name == 'OverconstrainedError' ||
					err?.name == 'DevicesNotFoundError'
				) {
					_value.audio.err = 'saknas';
				} else {
					_value.video.err = 'okänt fel';
				}
			}
		}

		// Update the audio producer
		if (_audioProducer) {
			// Close and the delete the producer if no local media stream exists or the user is blocked // TODO: is always closed?
			if (!_value.audio.stream || _value.audio.blocked || _value.audio.paused) {
				_value.audio.stream = undefined;
				_value.audio.paused = true;
				_audioProducer.close();
				_audioProducer = undefined;
				return;
			}

			// Check if the current stream has changed and update the video track in the producer
			const track = _value.audio.stream.getAudioTracks()[0];
			if (_audioProducer.track?.id != track.id) {
				_audioProducer.track?.stop();
				await _audioProducer.replaceTrack({ track });
			}

			// Pause and resume any ongoing stream as needed
			if (_value.audio.paused) {
				_audioProducer.pause();
			} else {
				_audioProducer.resume();
			}
		}
		// Create a new producer and add the existing track if possible
		else if (
			_value.audio.stream &&
			!_value.audio.paused &&
			!_value.audio.blocked
		) {
			// Get the rtc send transport for publishing
			const sendTransport = await rtcSendTransport();

			// Get the current audio track
			const track = _value.audio.stream.getAudioTracks()[0];

			// Produce
			_audioProducer = await sendTransport.produce({ track });
		}
	};

	const onDeviceStatusChange = () => {
		// Update the device list
		_onUpdateLists();

		// Remove any current video/audio stream if the device was disconnected
		if (
			_value.video.selected &&
			_value.video.list.findIndex(
				(device) => _value.video.selected!.deviceId == device.deviceId
			) == -1
		) {
			_value.video.selected = undefined;
			if (_value.video.stream) {
				_value.video.stream = undefined;
				_onUpdateVideo();
				_value.video.err = 'frånkopplad';
				set(_value);
			}
		}
		if (
			_value.audio.selected &&
			_value.audio.list.findIndex(
				(device) => _value.audio.selected!.deviceId == device.deviceId
			) == -1
		) {
			_value.video.selected = undefined;
			if (_value.audio.stream) {
				_value.audio.stream = undefined;
				_onUpdateAudio();
				_value.audio.err = 'frånkopplad';
				set(_value);
			}
		}
	};

	// Return the store
	return {
		/** Returns the current store value */
		get: () => _value,
		/** Select a media device to use for video */
		selectVideoDevice: async (deviceInfo: MediaDeviceInfo | undefined) => {
			// Switch internal stream, force an update if the selected device has changed
			const forceUpdate =
				_value.video.stream &&
				!!deviceInfo &&
				deviceInfo?.deviceId != _value.video.selected?.deviceId;

			// Switch internal selected device
			_value.video.selected = deviceInfo;

			// Force update to remove the current stream
			if (forceUpdate) {
				_value.video.stream = undefined;
				await _onUpdateVideo();
			}

			// Update local storage
			if (!deviceInfo) {
				localStorage.removeItem('selected-video-device');
			} else {
				localStorage.setItem(
					'selected-video-device',
					JSON.stringify(deviceInfo.toJSON())
				);
			}

			// Update video status
			await _onUpdateVideo();

			// Update store
			set(_value);
		},
		/** Select a media device to use for audio */
		selectAudioDevice: async (deviceInfo: MediaDeviceInfo | undefined) => {
			// Switch internal stream, force an update if the selected device has changed
			const forceUpdate =
				_value.audio.stream &&
				!!deviceInfo &&
				deviceInfo?.deviceId != _value.audio.selected?.deviceId;

			// Switch internal selected device
			_value.audio.selected = deviceInfo;

			// Force update to remove the current stream
			if (forceUpdate) {
				_value.audio.stream = undefined;
				await _onUpdateAudio();
			}

			// Update local storage
			if (!deviceInfo) {
				localStorage.removeItem('selected-audio-device');
			} else {
				localStorage.setItem(
					'selected-audio-device',
					JSON.stringify(deviceInfo.toJSON())
				);
			}

			// Update audio status
			await _onUpdateAudio();

			// Update store
			set(_value);
		},
		/** Manually updates the list of devices if not yet performed, and makes sure that the user has called get user media */
		updateDeviceLists: async (constraints: MediaStreamConstraints) => {
			if (!_hasCalledGetUserMedia) {
				await navigator.mediaDevices.getUserMedia(constraints);
				_hasCalledGetUserMedia = true;
			}
			await _onUpdateLists();

			// Update store
			set(_value);
		},
		/** Try to start/resume and returns a video input media stream */
		startVideoStream: async () => {
			_value.video.paused = false;
			await _onUpdateVideo();

			// Update store
			set(_value);
		},
		/** Try to pause any ongoing video input media stream */
		pauseVideoStream: async () => {
			_value.video.paused = true;
			await _onUpdateVideo();

			// Update store
			set(_value);
		},
		/** Try to start/resume and returns a audio input media stream */
		startAudioStream: async () => {
			_value.audio.paused = false;
			await _onUpdateAudio();

			// Update store
			set(_value);
		},
		/** Try to pause any ongoing audio input media stream */
		pauseAudioStream: async () => {
			_value.audio.paused = true;
			await _onUpdateAudio();

			// Update store
			set(_value);
		},
		subscribe,
	};
};

/** The Local Media Store provides information and controls for local media input-devices and media streams */
export const localMedia = createLocalMediaDevicesStores();
