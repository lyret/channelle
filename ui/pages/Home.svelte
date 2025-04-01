<script lang="ts">
	import cureFlowersSrc from "~/assets/images/cute-flowers.gif";
	import moneyPowerGreedSrc from "~/assets/images/money-power-greed.gif";
	import rosesSrc from "~/assets/images/roses.gif";
	import smokerSrc from "~/assets/images/smoker-cropped.png";
	import FloatingImage from "~/components/home/FloatingImage.svelte";
	import IconArrowRight from "~/components/icons/Icon-arrow-right.svelte";
	import { APIStore } from "~/lib/stores/api";
	// import Authenticate from "~/components/curtains/AuthenticateCurtainMessage.svelte";
	// import Blocked from "~/components/curtains/BlockedCurtainMessage.svelte";
	// import Continue from "~/components/curtains/ContinueCurtainMessage.svelte";
	// import Curtains from "~/components/curtains/Curtains.svelte";
	// import Loader from "~/components/curtains/LoadingCurtainMessage.svelte";
	// import Problem from "~/components/curtains/ProblemCurtainMessage.svelte";
	// import BackstagePage from "~/pages/Backstage.svelte";
	// import HomePage from "~/pages/Home.svelte";
	// import PlaygroundPage from "~/pages/Playground.svelte";
	// import StagePage from "~/pages/Stage.svelte";
	// import PasswordCurtainMessage from "./components/curtains/PasswordCurtainMessage.svelte";
	import { onMount } from "svelte";
	import { scenePasswordIsOk } from "../stores/scene/scenePassword";
	// import { sceneCurtains } from "./stores/scene/sceneCurtains";

	onMount(() => {
		document.querySelectorAll("a, .button").forEach((element) =>
			element.addEventListener("mouseenter", () => {
				document.documentElement.style.setProperty(
					"--channelle-random-rotation",
					`rotate(${Math.floor(Math.random() * 6) - 4}deg)`
				);
			})
		);
	});

	// Determine what should be rendered
	$: isBlocked = $APIStore.status == "blocked";
	$: hasEnteredName = $APIStore.status == "ready" && $APIStore.participant.name;
	$: needStagePassword = !$scenePasswordIsOk;
</script>

<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={2} />
<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={2} />
<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={2} />
<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={2} />

<main>
	<div class="poster">
		<h2 class="subtitle is-1">Föreställning</h2>
		<h1 class="title is-1">Sommaruppehåll</h1>
		<button
			class="button main"
			on:click={() => {
				if (!isBlocked) {
					window.location.href = "/stage";
				}
			}}
			><span class="is-family-secondary" class:is-strikethrough={isBlocked}
				>{hasEnteredName ? "GÅ TILLBAKA IN" : "BESÖK"}</span
			></button
		>
		<button class="button"
			><span class="is-family-default">Om föreställningen</span></button
		>
		<button class="button"
			><span class="is-family-default">Hur funkar det?</span></button
		>
	</div>
	<div class="info">
		<div class="area left">
			<h1 class="title is-1">Channelle</h1>
		</div>
		<div class="area right">
			<img src={smokerSrc} alt="a woman smoking" />
		</div>
	</div>
	<div class="menu">
		<div class="area left">
			<a
				href="https://maskinrepubliken.se"
				class="is-family-secondary has-text-weight-bold">Maskinrepubliken</a
			>
			<a
				href="https://www.facebook.com/people/Skärmteatern/100076254422586/"
				class="is-family-secondary has-text-weight-bold">Skärmteatern</a
			>
		</div>
		<div class="area center">
			<img
				class="logo"
				src={cureFlowersSrc}
				alt="cute flowers dancing around"
			/>
		</div>
		<div class="area right">
			<a
				class="is-family-secondary has-text-weight-medium"
				href="/backstage"
				target="_blank"
				>Gå Backstage <span class="icon"><IconArrowRight /></span></a
			>
			<img src={moneyPowerGreedSrc} alt="text saying money power greed" />
			<h1
				class="title is-2 is-family-secondary has-text-weight-medium is-strikethrough mb-0 pb-0"
			>
				Biljettluckan
			</h1>
			<h1
				class="title is-3 is-family-secondary has-text-weight-medium is-italic"
			>
				Gratis föreställning!
			</h1>
		</div>
	</div>
</main>

<style lang="scss">
	main {
		background-color: var(--channelle-primary-color);
		color: var(--channelle-primary-text-color);
		z-index: 1;
		width: 100%;
		height: 100%;
		max-height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		flex-wrap: nowrap;
		justify-content: normal;
		align-items: normal;
		align-content: normal;
	}
	.poster {
		display: flex;
		flex-direction: column;
		justify-content: center;
		text-align: center;
		flex-grow: 1;
		.title {
			z-index: 3;
			color: var(--channelle-primary-text-color);
			font-size: 4.5vw;
			@include mobile {
				font-size: 9vw;
			}
		}
		.subtitle {
			z-index: 3;
			color: var(--channelle-primary-text-color);
			font-size: 2.5vw;
			@include mobile {
				font-size: 7vw;
			}
		}
		.button {
			background: none;
			border: none;
			box-shadow: none;
		}
		.button span {
			font-weight: 700;
			z-index: 3;
			color: var(--channelle-primary-text-color);
			font-size: 2.5vw;
			@include mobile {
				font-size: 7vw;
			}
		}
		.button.main span {
			font-weight: 800;
			font-size: 3vw;
			@include mobile {
				font-size: 9vw;
			}
		}
		.button:hover span {
			transform: var(--channelle-random-rotation);
			text-decoration: underline;
		}
	}
	.info {
		background-color: var(--channelle-primary-color);
		z-index: 3;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: normal;
		align-items: end;
		color: var(--channelle-primary-text-color);
		flex-shrink: 1;
		flex-grow: 0;
		order: 0;

		.area.left {
			flex-grow: 1;
			align-content: end;
			text-align: left;

			.title {
				color: var(--channelle-primary-text-color);
				font-size: 5em;
			}
		}
		.area.right {
			flex-grow: 0;
		}

		@include mobile {
			flex-direction: column;
			.area.right {
				width: 100%;
				text-align: center;
			}
			.area.left {
				width: 100%;
				text-align: center;

				.title {
					font-size: 4em;
				}
			}
		}
	}
	.menu {
		background-color: var(--channelle-secondary-color);
		padding: 8px;
		z-index: 3;
		color: var(--channelle-secondary-text-color);
		flex-grow: 0;
		order: 1;

		display: flex;
		flex-direction: row;
		justify-content: center;
		flex-wrap: nowrap;
		justify-content: normal;
		align-items: normal;
		align-content: normal;

		@include mobile {
			flex-direction: column;
		}

		a {
			display: block;
			font-size: 1.6rem;
			color: var(--channelle-secondary-text-color);
		}
		a:hover {
			transform: var(--channelle-random-rotation);
			text-decoration: underline;
		}

		.area.left {
			align-content: end;
			text-align: left;
		}
		.area.center {
			flex-grow: 1;
			text-align: center;

			@include mobile {
				img {
					display: none;
				}
			}
		}
		.area.right {
			align-content: center;
			text-align: right;
			max-width: 25vw;
			@include mobile {
				text-align: left;
				max-width: 50vw;
			}
		}
	}
</style>
