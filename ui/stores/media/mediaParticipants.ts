import type { DataTypes } from '~/api';
import { derived } from 'svelte/store';
import { currentParticipant } from '../connection';
import { createMediaStore } from '../_mediaStore';
import { createDatabaseStore } from '../_databaseStore';
import { createMediaOptionStore } from './mediaOptions';

const remoteMediaStreams = createMediaStore('remoteMediaStreams');
const localMediaStream = createMediaStore('localMediaStream');
const participants = createDatabaseStore('participant');
const layout = createMediaOptionStore('layout');
const allowVisitorAudio = createMediaOptionStore('allowVisitorAudio');

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
			currentParticipant,
			localMediaStream,
			layout,
			allowVisitorAudio,
		],
		([
			$remoteMediaStreams,
			$participants,
			$currentParticipant,
			$localMediaStream,
			$layout,
			$allowVisitorAudio,
		]) => {
			const results: MediaParticipants = {
				audio: [],
				video: {},
				actors: {},
				online: [],
			};
			const layoutedActorsRecord: Record<number, true | undefined> = (
				$layout || []
			)
				.flat()
				.filter((e) => e.type == 'actor' && e.id)
				.map((e: any) => e.id)
				.reduce((obj, nr) => ({ [nr]: true, ...obj }), {});

			for (const participant of $participants) {
				if (participant.blocked) {
					continue;
				}
				if (participant.online) {
					results.online.push(participant);
				}
				// Actor
				if (participant.actor) {
					results.actors[participant.id] = participant;

					// Should be streaming
					if (layoutedActorsRecord[participant.id]) {
						// Remote media
						if (
							$remoteMediaStreams[participant.id] &&
							participant.allowedVideo
						) {
							results.video[participant.id] =
								$remoteMediaStreams[participant.id];
							results.audio.push($remoteMediaStreams[participant.id]);
						}
						// Local media
						else if (
							participant.id == $currentParticipant.id &&
							$localMediaStream &&
							participant.allowedVideo
						) {
							results.video[participant.id] = $localMediaStream;
						}
					}
				} else {
					if (
						$remoteMediaStreams[participant.id] &&
						$allowVisitorAudio &&
						participant.allowedAudio
					) {
						results.audio.push($remoteMediaStreams[participant.id]);
					}
				}
			}

			// Return results
			console.log(results, $localMediaStream);

			return results;
		}
	);

	return {
		subscribe: subscribe,
	};
}

/** The current participants with streaming media from the API */
export const mediaParticipants = createMediaParticipantsStore();
