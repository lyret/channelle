import { createLocalStore } from '../_localStore';

/** The users policy for local storage and cookies stored in local storage */
export const cookiesAllowed = createLocalStore<boolean>(
	'cookies-allowed',
	false
);
