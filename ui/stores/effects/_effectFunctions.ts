import Confetti from "canvas-confetti";
import analogClap from "~/assets/sounds/analog-clap.wav";
import danceClap from "~/assets/sounds/dance-clap.wav";
import sharpClap from "~/assets/sounds/sharp-clap.wav";
import shineSrc from "~/assets/sounds/shine.wav";
import tinkSrc from "~/assets/sounds/c4.wav";
import slimeSrc from "~/assets/sounds/slime.wav";

/** Helper to create a sound effect with the preset audio */
const _addSound = (src: string, volume: number = 1): HTMLAudioElement => {
	const snd = new Audio(src);
	snd.volume = volume;
	return snd;
};

/** Flower SVG shape for confetti effects */
const flower = Confetti.shapeFromText({ text: "🌹", scalar: 4 });

/** Hands SVG shape for confetti effects */
const hands = Confetti.shapeFromText({ text: "👏", scalar: 6 });

/** Tomato SVG shape for confetti effects */
const tomato = Confetti.shapeFromText({ text: "🍅", scalar: 8 });

/** Clap sound effects */
const clapSounds = [_addSound(sharpClap, 0.5), _addSound(analogClap, 0.6), _addSound(danceClap, 0.5)];

/** Flower sound effect */
const flowerSounds = [_addSound(tinkSrc, 0.5), _addSound(shineSrc, 0.7)];

// Tomato sound effects
const tomatoSounds = [_addSound(slimeSrc, 0.6)];

// Celebration methods

/** Sends Flowers */
export function triggerFlowerGiftEffect() {
	const i = Math.floor(Math.random() * flowerSounds.length);
	if (flowerSounds[i].paused) {
		flowerSounds[i].play();
	} else {
		flowerSounds[i].currentTime = 0;
	}

	Confetti({
		particleCount: 2,
		angle: 90,
		spread: 30,
		origin: { y: 0.9, x: Math.random() },
		gravity: 0.8,
		decay: 0.5,
		startVelocity: 100,
		colors: ["#b83334"],
		shapes: [flower, "circle"],
		scalar: 2,
	});
	Confetti({
		particleCount: 4,
		angle: 90,
		spread: 30,
		origin: { y: 0.9, x: Math.random() },
		gravity: 0.8,
		decay: 0.6,
		startVelocity: 100,
		colors: ["#b83334"],
		shapes: [flower, flower, flower],
		scalar: 4,
	});
	setTimeout(
		() =>
			Confetti({
				particleCount: 2,
				angle: 90,
				spread: 30,
				origin: { y: 0.9, x: Math.random() },
				gravity: 0.8,
				decay: 0.5,
				startVelocity: 100,
				colors: ["#b83334"],
				shapes: [flower, "circle"],
				scalar: 2,
			}),
		100,
	);
}

/** Clap */
export function triggerApplauseEffect() {
	const i = Math.floor(Math.random() * clapSounds.length);
	if (clapSounds[i].paused) {
		clapSounds[i].play();
	} else {
		clapSounds[i].currentTime = 0;
	}

	const x = Math.random();
	Confetti({
		particleCount: 20,
		angle: 90,
		spread: 60,
		origin: { y: 1, x },
		gravity: 0.9,
		decay: 0.6,
		startVelocity: 65,
		colors: ["#f9e231"],
		shapes: ["star"],
		scalar: 0.8,
		//@ts-expect-error unknown property
		flat: false,
	});
	Confetti({
		particleCount: 1,
		angle: 90,
		spread: 0,
		origin: { y: 0.9, x },
		gravity: 0.8,
		decay: 0.4,
		startVelocity: 60,
		colors: ["#f9e231"],
		shapes: [hands],
		scalar: 5,
		//@ts-expect-error unknown property
		flat: true,
	});
}

/** Tomato throw */
export function triggerTomatoEffect() {
	setTimeout(() => {
		const i = Math.floor(Math.random() * tomatoSounds.length);
		if (tomatoSounds[i].paused) {
			tomatoSounds[i].play();
		} else {
			tomatoSounds[i].currentTime = 0;
		}
	}, 400);

	const x = Math.random();
	Confetti({
		particleCount: 1,
		angle: 90,
		spread: 45,
		origin: { y: 0.9, x },
		gravity: 0.5,
		decay: 0.9,
		startVelocity: 60,
		colors: ["#f9e231"],
		shapes: [tomato],
		scalar: 8,
		//@ts-expect-error unknown property
		flat: true,
	});
}
