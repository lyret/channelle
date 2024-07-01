import { derived } from 'svelte/store';
import { SocketSubscription, create, findOne } from '~/api';
import { connectionStatus } from './connectionStatus';
import { createDerivedAPIStore } from '../_apiStore';
import { createLocalStore } from '../_localStore';
import type { ParticipationStatusName } from '~/api';

/**The participant id stored in local storage */
export const userParticipantId = createLocalStore<number | undefined>(
	'participant-id',
	undefined
);

/** The current user participant */
export const currentParticipant = derived(
	[
		userParticipantId,
		connectionStatus,
		createDerivedAPIStore(userParticipantId, 'participant'),
	],
	([$userParticipantId, $connectionStatus, $userParticipant]) => {
		if ($connectionStatus == 'connected') {
			if (!$userParticipantId && !$userParticipant) {
				create('participant', {
					data: {
						name: '',
						online: true,
					},
				}).then((partipant) => {
					userParticipantId.set(partipant.id);
					SocketSubscription.registerParticipation();
				});
			} else {
				findOne('participant', { where: { id: $userParticipantId } }).then(
					(verifiedExistingParticipant) => {
						if (!verifiedExistingParticipant) {
							userParticipantId.set(undefined);
						}
					}
				);
			}
		}

		if ($userParticipant) return $userParticipant;
	}
);

/** The current user participationStatus */
export const currentParticipationStatus = derived<
	[typeof connectionStatus, typeof currentParticipant],
	ParticipationStatusName
>(
	[connectionStatus, currentParticipant],
	([$connectionStatus, $currentParticipant]) => {
		if ($currentParticipant && $currentParticipant.blocked) {
			return 'blocked';
		}
		if ($connectionStatus == 'connected') {
			return 'online';
		}
		return 'offline';
	}
);
