import { derived } from 'svelte/store';
import { Subscription, create, findOne } from '~/api';
import { connectionStatus } from './connectionStatus';
import { createDerivedAPIStore } from '../_apiStore';
import { createLocalStore } from '../_localStore';

/**The participant id stored in local storage */
export const userParticipantId = createLocalStore<number | undefined>(
	'participant-id',
	undefined
);

/** The current user participant */
const userParticipant = createDerivedAPIStore(userParticipantId, 'participant');

/** Indicates that the given admin information is valid */
export const currentParticipant = derived(
	[userParticipantId, connectionStatus, userParticipant],
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
					Subscription.registerParticipation();
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
