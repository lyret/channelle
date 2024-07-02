import { derived } from 'svelte/store';
import type { ParticipationStatusName, DataTypes } from '~/api';
import { RepositorySubscription, create, findOne } from '~/api';
import { connectionStatus } from './connectionStatus';
import { createDerivedDataStore } from '../_databaseStore';
import { createLocalStore } from '../_localStore';

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
		createDerivedDataStore(userParticipantId, 'participant'),
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
					RepositorySubscription.registerParticipation();
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

		if ($userParticipant) {
			return $userParticipant;
		} else {
			return null as any as DataTypes['participant'];
		}
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
