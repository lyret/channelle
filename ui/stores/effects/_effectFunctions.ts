import Confetti from "canvas-confetti";
import clapSrc from "~/assets/sounds/analog-clap.wav";
import tinkSrc from "~/assets/sounds/c4.wav";

/** Flower SVG shape for confetti effects */
const flower = Confetti.shapeFromText({ text: "🌹", scalar: 4 });

/** Hands SVG shape for confetti effects */
const hands = Confetti.shapeFromText({ text: "👏", scalar: 6 });

/** Tomato SVG shape for confetti effects */
const tomato = Confetti.shapeFromText({ text: "🍅", scalar: 4 });

/** Clap sound effect */
const clap = new Audio(clapSrc);

/** Tink sound effect */
const tink = new Audio(tinkSrc);

// Celebration methods

/** Sends Flowers */
export function triggerFlowerGiftEffect() {
	if (tink.paused) {
		tink.play();
	} else {
		tink.currentTime = 0;
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
	if (clap.paused) {
		clap.play();
	} else {
		clap.currentTime = 0;
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
	if (clap.paused) {
		clap.play();
	} else {
		clap.currentTime = 0;
	}

	const x = Math.random();
	Confetti({
		particleCount: 3,
		angle: 270,
		spread: 45,
		origin: { y: 0, x },
		gravity: 1.2,
		decay: 0.8,
		startVelocity: 30,
		colors: ["#ff4444", "#cc0000"],
		shapes: [tomato],
		scalar: 3,
		//@ts-expect-error unknown property
		flat: false,
	});
	setTimeout(
		() =>
			Confetti({
				particleCount: 2,
				angle: 270,
				spread: 30,
				origin: { y: 0, x: Math.random() },
				gravity: 1.2,
				decay: 0.7,
				startVelocity: 35,
				colors: ["#ff4444", "#cc0000"],
				shapes: [tomato],
				scalar: 2,
				//@ts-expect-error unknown property
				flat: false,
			}),
		150,
	);
}
