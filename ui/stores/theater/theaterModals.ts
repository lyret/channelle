import { writable } from "svelte/store";
import { fetchHistory } from "~/api/history";
import { updateRemoteServerStatus } from "~/api/theater";
import { fetchShows } from "~/api/shows";

/** Store for authentication modal visibility */
export const showAuthModal = writable<boolean>(false);

/** Store for about modal visibility */
export const showAboutModal = writable<boolean>(false);

/** Store for create show modal visibility */
export const showCreateShowModal = writable<boolean>(false);

/** Store for remote server modal visibility */
export const showRemoteServerModal = writable<boolean>(false);

/** Store for history modal visibility */
export const showHistoryModal = writable<boolean>(false);

/** Open authentication modal */
export function openAuthModal() {
	showAuthModal.set(true);
}

/** Close authentication modal */
export function closeAuthModal() {
	showAuthModal.set(false);
}

/** Open about modal */
export function openAboutModal() {
	showAboutModal.set(true);
}

/** Close about modal */
export function closeAboutModal() {
	showAboutModal.set(false);
}

/** Open create show modal */
export function openCreateShowModal() {
	showCreateShowModal.set(true);
}

/** Close create show modal */
export function closeCreateShowModal() {
	showCreateShowModal.set(false);
}

/** Open remote server modal */
export async function openRemoteServerModal() {
	await fetchShows();
	await updateRemoteServerStatus();
	showRemoteServerModal.set(true);
}

/** Close remote server modal */
export function closeRemoteServerModal() {
	showRemoteServerModal.set(false);
}

/** Open history modal */
export async function openHistoryModal() {
	await fetchHistory();
	showHistoryModal.set(true);
}

/** Close history modal */
export function closeHistoryModal() {
	showHistoryModal.set(false);
}

/** Close all modals */
export function closeAllModals() {
	showAuthModal.set(false);
	showAboutModal.set(false);
	showCreateShowModal.set(false);
	showRemoteServerModal.set(false);
	showHistoryModal.set(false);
}
