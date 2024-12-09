import type { StageLayout } from '~/../server/stores/stage';
import { createRemoteValueStore } from '~/lib/store-generators';
export type { StageLayout } from '~/../server/stores/stage';

/** Keeps tracks of the configured stage layout */
export const stageLayout = createRemoteValueStore<StageLayout>(
	'stage-layout',
	[]
);
