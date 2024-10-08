import type { DataTypes } from '~/lib';
import { derived } from 'svelte/store';
import { APIStore } from '~/lib/stores/api';
import { MediaStore } from '~/lib/stores/media';
import { createDatabaseStore } from '../lib/store-generators/createDatabaseStore';
import { userCameraBans, userMicrophoneBans } from './users';
import { sceneLayout } from './stage/stageLayout';
import { sceneVisitorAudioIsEnabled } from './scene/sceneVisitorAudioIsEnabled';
export const participants = createDatabaseStore('participant');

/** Store value */
type MediaParticipants = {
	video: Record<DataTypes['participant']['id'], MediaStream>;
	audio: Array<MediaStream>;
	actors: Record<DataTypes['participant']['id'], DataTypes['participant']>;
	online: Array<DataTypes['participant']>;
};

/** Store interface */
interface MediaParticipantsStore {
	subscribe: (subscription: (value: MediaParticipants) => void) => () => void;
}

/** Creates a Svelte Store for tracking remote media stream coming from individual participants */
function createMediaParticipantsStore(): MediaParticipantsStore {
	const { subscribe } = derived(
		[
			participants,
			APIStore,
			MediaStore,
			sceneLayout,
			sceneVisitorAudioIsEnabled,
			userCameraBans,
			userMicrophoneBans,
		],
		([
			$participants,
			$APIStore,
			$MediaStore,
			$sceneLayout,
			$sceneVisitorAudioIsEnabled,
			$userCameraBans,
			$userMicrophoneBans,
		]) => {
			const results: MediaParticipants = {
				audio: [],
				video: {},
				actors: {},
				online: [],
			};
			try {
				const layoutedActorsRecord: Record<number, true | undefined> = (
					$sceneLayout || []
				)
					.flat()
					.filter((e) => e.type == 'actor' && e.id)
					.map((e: any) => e.id)
					.reduce((obj, nr) => ({ [nr]: true, ...obj }), {});

				for (const participant of $participants) {
					if (participant.blocked) {
						continue;
					}
					// TODO: this is broken as .online is removed
					// if (participant.online) {
					// 	results.online.push(participant);
					// }
					// Actor
					if (participant.actor) {
						results.actors[participant.id] = participant;

						// Should be streaming
						if (layoutedActorsRecord[participant.id]) {
							// Remote media
							if (
								$MediaStore.remoteMediaStreams[participant.id] &&
								!$userCameraBans[participant.id]
							) {
								results.video[participant.id] =
									$MediaStore.remoteMediaStreams[participant.id];
								results.audio.push(
									$MediaStore.remoteMediaStreams[participant.id]
								);
							}
							// Local media
							else if (
								$APIStore.status == 'ready' &&
								$APIStore.participantId == participant.id &&
								$MediaStore.localMediaStream &&
								!$userCameraBans[participant.id]
							) {
								results.video[participant.id] = $MediaStore.localMediaStream;
							}
						}
					} else {
						if (
							$MediaStore.remoteMediaStreams[participant.id] &&
							$sceneVisitorAudioIsEnabled &&
							!$userMicrophoneBans[participant.id]
						) {
							results.audio.push(
								$MediaStore.remoteMediaStreams[participant.id]
							);
						}
					}
				}
			} catch (error) {
				console.error(error);
			}

			// Return results
			console.log('MP', { results });

			return results;
		}
	);

	return {
		subscribe: subscribe,
	};
}

/** The current participants with streaming media from the API */
export const mediaParticipants = createMediaParticipantsStore();
