import { writable } from "svelte/store";

/** Store for authentication modal visibility */
export const showAuthModal = writable<boolean>(false);

/** Store for about modal visibility */
export const showAboutModal = writable<boolean>(false);

/** Store for create stage modal visibility */
export const showCreateStageModal = writable<boolean>(false);

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

/** Open create stage modal */
export function openCreateStageModal() {
	showCreateStageModal.set(true);
}

/** Close create stage modal */
export function closeCreateStageModal() {
	showCreateStageModal.set(false);
}

/** Close all modals */
export function closeAllModals() {
	showAuthModal.set(false);
	showAboutModal.set(false);
	showCreateStageModal.set(false);
}
