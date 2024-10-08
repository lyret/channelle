import type { PredefinedLayout } from '~/../server/stores/stage';
import { createRemoteValueStore } from '~/lib/store-generators';
export type { PredefinedLayout } from '~/../server/stores/stage';

/** Keeps track of the selected predefined layout in the scene instrument */
export const selectedPredefinedStageLayout = createRemoteValueStore<
	PredefinedLayout | undefined
>('selected-predefined-stage-layout');
