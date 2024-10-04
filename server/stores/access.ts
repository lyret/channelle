import { observableValue } from '../api';

/** Keeps tracks of the currently set scene password, if any */
export const scenePassword = observableValue<string | undefined>(
	'scene-password',
	undefined
);
