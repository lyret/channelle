import type { DataTypes } from '~/api';
import { derived } from 'svelte/store';
import { currentParticipant } from '../connection';
import { createMediaStore } from '../_mediaStore';
import { createDatabaseStore } from '../_databaseStore';

const remoteVideoStreams = createMediaStore('remoteMediaStreams');
const localMediaStream = createMediaStore('localMediaStream');
const participants = createDatabaseStore('participant');

/** Store value */
type MediaParticipants = Array<
	DataTypes['participant'] & {
		stream: MediaStream;
	}
>;

/** Store interface */
interface MediaParticipantsStore {
	subscribe: (subscription: (value: MediaParticipants) => void) => () => void;
}

/** Creates a Svelte Store for tracking remote media stream coming from individual participants */
function createMediaParticipantsStore(): MediaParticipantsStore {
	const { subscribe } = derived(
		[remoteVideoStreams, participants, currentParticipant, localMediaStream],
		([
			$remoteVideoStreams,
			$participants,
			$currentParticipant,
			$localMediaStream,
		]) => {
			// Join remote video streams and participants
			const results: MediaParticipants = (
				Object.entries($remoteVideoStreams)
					// Map participants to stream
					.map(([participantId, stream]) => {
						const foundParticipant = $participants.find(
							(p) => p.id == Number(participantId)
						);
						if (!foundParticipant) {
							return undefined;
						}
						return { ...foundParticipant, stream };
					})
					// Remove streams where the participant was not found
					.filter((entry) => entry !== undefined) as MediaParticipants
			).filter((entry) => {
				// Remove entries that are producing audio even when not allowed
				if (entry.stream.getAudioTracks().length && !entry.allowedAudio) {
					return false;
				}
				// Remove entries that are producing video even when not allowed
				if (entry.stream.getVideoTracks().length && !entry.allowedVideo) {
					return false;
				}
				return true;
			});

			// Add any local stream
			if (
				$localMediaStream &&
				$currentParticipant &&
				$currentParticipant.producingVideo
			) {
				results.push({
					stream: $localMediaStream!,
					...$currentParticipant,
				});
			}
			// Return results
			console.log({
				results,
				$remoteVideoStreams,
				$participants,
				$currentParticipant,
				$localMediaStream,
			});
			return results;
		}
	);

	return {
		subscribe: subscribe,
	};
}

/** The current participants with streaming media from the API */
export const mediaParticipants = createMediaParticipantsStore();
