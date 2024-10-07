import type { DataTypes } from '~/lib';
import { derived } from 'svelte/store';
import { APIStore } from '~/lib/stores/api';
import { createMediaStore } from '../_mediaStore';
import { createDatabaseStore } from '../_databaseStore';
import { userCameraBans, userMicrophoneBans } from '../users';
import { sceneLayout } from '../scene/sceneLayout';
import { sceneVisitorAudioIsEnabled } from '../scene/sceneVisitorAudioIsEnabled';

const remoteMediaStreams = createMediaStore('remoteMediaStreams');
const localMediaStream = createMediaStore('localMediaStream');
const participants = createDatabaseStore('participant');

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
			remoteMediaStreams,
			participants,
			APIStore,
			localMediaStream,
			sceneLayout,
			sceneVisitorAudioIsEnabled,
			userCameraBans,
			userMicrophoneBans,
		],
		([
			$remoteMediaStreams,
			$participants,
			$APIStore,
			$localMediaStream,
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
								$remoteMediaStreams[participant.id] &&
								!$userCameraBans[participant.id]
							) {
								results.video[participant.id] =
									$remoteMediaStreams[participant.id];
								results.audio.push($remoteMediaStreams[participant.id]);
							}
							// Local media
							else if (
								$APIStore.status == 'ready' &&
								$APIStore.participantId == participant.id &&
								$localMediaStream &&
								!$userCameraBans[participant.id]
							) {
								results.video[participant.id] = $localMediaStream;
							}
						}
					} else {
						if (
							$remoteMediaStreams[participant.id] &&
							$sceneVisitorAudioIsEnabled &&
							!$userMicrophoneBans[participant.id]
						) {
							results.audio.push($remoteMediaStreams[participant.id]);
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
