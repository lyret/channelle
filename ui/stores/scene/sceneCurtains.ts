import { createOVStore } from '~/api/OVStore';

/** Keeps tracks of the manually set curtain position by the managers */
export const sceneCurtains = createOVStore<boolean>('scene-curtains');
