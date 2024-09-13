import { derived } from 'svelte/store';
import { createMediaOptionStore } from './mediaOptions';
import dreamLoopSrc from '~/assets/sounds/dream-loop.wav';

/** Dream sound loop */
var dream = new Audio(dreamLoopSrc);

/** Synced state of the curtains */
const curtainOption = createMediaOptionStore('curtains');

/** State of the curtains, with side effects */
export const curtains = derived(curtainOption, ($curtains) => {
	if ($curtains) {
		if (dream.paused) {
			setTimeout(async () => {
				dream.autoplay = true;
				dream.loop = true;
				dream.currentTime = 0;
				dream.volume = 0;
				dream.play();

				while (dream.volume < 1) {
					await new Promise((res) => {
						setTimeout(() => res((dream.volume += 0.05)), 200);
					});
				}
			}, 200);
		}
	} else {
		dream.pause();
	}
	return $curtains;
});
