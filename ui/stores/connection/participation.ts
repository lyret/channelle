import { derived, writable } from 'svelte/store'
import { create, findOne } from '~/api'
import { connectionStatus } from './connectionStatus'
import { createDerivedAPIStore } from '../_apiStore'
import { createLocalStore } from '../_localStore'

/**The participant id stored in local storage */
export const userParticipantId = createLocalStore<number | undefined>(
  'participant-id',
  undefined
)

/** The current user participant */
const userParticipant = createDerivedAPIStore(userParticipantId, 'participant')

/** Indicates that the given admin information is valid */
export const currentParticipant = derived(
  [userParticipantId, connectionStatus, userParticipant],
  ([$userParticipantId, $connectionStatus, $userParticipant]) => {
    if ($connectionStatus == 'connected') {
      if (!$userParticipantId) {
        create('participant', {
          data: {
            name: 'Viktor Lyresten', // FIXME: Fixed name
            online: true,
          },
        }).then((partipant) => userParticipantId.set(partipant.id))
      } else {
        findOne('participant', { where: { id: $userParticipantId } }).then(
          (verifiedExistingParticipant) => {
            if (!verifiedExistingParticipant) {
              userParticipantId.set(undefined)
            }
          }
        )
      }
    }
    return $userParticipant
  }
)

//
// /**Local storage tracker for signed-in status */
// const adminHasPerformedSignIn = createLocalStore<boolean>(
//   "admin-active",
//   false
// );
//
//
//
// /** The admin password stored in local storage */
// export const adminPassword = createLocalStore<string | undefined>(
//   "admin-password",
//   undefined
// );
//

//
// /** Indicates that the admin has signed in */
// export const adminIsSignedIn = derived(
//   [adminInformationIsValid, adminHasPerformedSignIn],
//   ([$adminInformationIsValid, $adminHasPerformedSignIn]) => {
//     return $adminInformationIsValid && $adminHasPerformedSignIn;
//   }
// );
//
// /** Sign in as administrator */
// export function signIn() {
//   enableNotifications();
//   adminHasPerformedSignIn.set(true);
// }
//
// /** Sign out as administrator */
// export function signOut() {
//   adminPassword.set(undefined);
//   adminUsername.set(undefined);
//   adminHasPerformedSignIn.set(false);
// }
//
// /** Any selected order in the delivery window overview */
// export const selectedOrder = writable<Order | undefined>(undefined);
