<script lang="ts">
	import { onMount } from "svelte";
	import cureFlowersSrc from "~/assets/images/cute-flowers.gif";
	import moneyPowerGreedSrc from "~/assets/images/money-power-greed.gif";
	import rosesSrc from "~/assets/images/roses.gif";
	import smokerSrc from "~/assets/images/smoker-cropped.png";
	import ticketsSrc from "~/assets/images/tickets.png";
	import { scenePasswordIsOk } from "~/stores/scene/scenePassword";
	import Wrapper from "./_Wrapper.svelte";
	import PasswordCurtainMessage from "~/components/curtains/PasswordCurtainMessage.svelte";
	import FloatingImage from "~/components/home/FloatingImage.svelte";
	import IconArrowRight from "~/components/icons/Icon-arrow-right.svelte";
	import PicolCancel from "~/components/picol/icons/Picol-cancel.svelte";
	import { APIStore } from "~/lib/stores/api";

	onMount(() => {
		document.querySelectorAll("a, .button").forEach((element) =>
			element.addEventListener("mouseenter", () => {
				document.documentElement.style.setProperty("--channelle-random-rotation", `rotate(${Math.floor(Math.random() * 6) - 4}deg)`);
			}),
		);
	});

	// Determine what should be rendered
	$: isBlocked = $APIStore.status == "blocked";
	$: hasEnteredName = $APIStore.status == "ready" && $APIStore.participant.name;
	$: needStagePassword = !$scenePasswordIsOk;

	let howToModalIsOpen = false;
</script>

<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={2} />
<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={2} />
<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={2} />
<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={2} />

<Wrapper lockedToManager={false} lockedToInviteKey={false} hasInteractedWithTheDocument={true}>
	<main>
		{#if howToModalIsOpen}
			<div class="popup">
				<button class="close icon" on:click={() => (howToModalIsOpen = false)}><PicolCancel /></button>
				<h1 class="title">
					<span class="is-family-default">Jo det går till såhär</span>
				</h1>
				<p>
					Först blablabka
					<br />Sedan…<br /><br />Om du inte känner dig bekväm med det…<br /><br />Om du redan betalat och har en kod går du hit: Annars gör du såhär
				</p>
			</div>
		{:else}
			<div class="poster">
				<h2 class="subtitle is-1">Föreställning</h2>
				<h1 class="title is-1">{CONFIG.stage.name}</h1>
				{#if needStagePassword}
					<div class="item">
						<div>
							<img src={ticketsSrc} alt="A man in a ticket booth" />
						</div>
						<div>
							<PasswordCurtainMessage />
						</div>
					</div>
				{:else}
					<button
						class="button main"
						on:click={() => {
							if (!isBlocked) {
								window.location.href = "/stage";
							}
						}}><span class="is-family-secondary" class:is-strikethrough={isBlocked}>{hasEnteredName ? "GÅ TILLBAKA IN" : "BESÖK"}</span></button
					>
				{/if}
				<a class="button alt" target="_blank" href="https://www.youtube.com/watch?v=8IXjE4a5Tj4"
					><span class="is-family-default p-2">Om föreställningen <span class="icon"><IconArrowRight /></span></span></a
				>
				<button class="button"><span class="is-family-default" on:click={() => (howToModalIsOpen = true)}>Hur funkar det?</span></button>
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
					<a href="https://maskinrepubliken.se" class="is-family-secondary has-text-weight-bold">Maskinrepubliken</a>
					<a href="https://www.facebook.com/people/Skärmteatern/100076254422586/" class="is-family-secondary has-text-weight-bold">Skärmteatern</a>
				</div>
				<div class="area center">
					<img class="logo" src={cureFlowersSrc} alt="cute flowers dancing around" />
				</div>
				<div class="area right">
					<a class="is-family-secondary has-text-weight-medium" href="/backstage" target="_blank"
						>Gå Backstage <span class="icon"><IconArrowRight /></span></a
					>
					<img src={moneyPowerGreedSrc} alt="text saying money power greed" />
					<h1 class="title is-2 is-family-secondary has-text-weight-medium is-strikethrough mb-0 pb-0">Biljettluckan</h1>
					<h1 class="title is-3 is-family-secondary has-text-weight-medium is-italic">Gratis föreställning!</h1>
				</div>
			</div>
		{/if}
	</main>
</Wrapper>

<style lang="scss">
	.popup {
		z-index: 3;
		background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-menu-text-color);
		position: fixed;
		top: 2vh;
		bottom: 2vh;
		left: 12vw;
		right: 12vw;
		padding: 24px;
		padding-top: 48px;

		.close {
			width: 7%;
			height: 7%;
			position: fixed;
			top: 2vh;
			right: 12vw;
			padding-top: 4px;
			padding-right: 4px;
		}

		.title span {
			color: var(--channelle-menu-bg-color);
			background-color: var(--channelle-menu-text-color);
			padding: 12px 8px;
		}

		@include mobile {
			left: 4vw;
			right: 4vw;

			.close {
				right: 4vw;
			}
		}
	}
	main {
		background-color: var(--channelle-main-bg-color);
		color: var(--channelle-main-text-color);
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
		justify-items: center;
		align-items: center;
		text-align: center;
		flex-grow: 1;

		.item {
			background-color: var(--channelle-main-bg-color);
			color: var(--channelle-main-text-color);
			display: flex;
			flex-direction: row;
			padding: 12px;
			z-index: 3;
			height: auto;
			max-width: 700px;

			img {
				max-height: 100%;
			}
		}
		.title {
			z-index: 3;
			color: var(--channelle-main-text-color);
			font-size: clamp(20px, 4.5vw, 90px);
			@include mobile {
				font-size: clamp(20px, 9vw, 90px);
			}
		}
		.subtitle {
			z-index: 3;
			color: var(--channelle-main-text-color);
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
		.button.alt > span {
			color: var(--channelle-main-bg-color);
			background-color: var(--channelle-main-text-color);
		}
		.button span {
			font-weight: 700;
			z-index: 3;
			color: var(--channelle-main-text-color);
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
		background-color: var(--channelle-main-bg-color);
		z-index: 3;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: normal;
		align-items: end;
		color: var(--channelle-main-text-color);
		flex-shrink: 1;
		flex-grow: 0;
		order: 0;

		.area.left {
			flex-grow: 1;
			align-content: end;
			text-align: left;

			.title {
				color: var(--channelle-main-text-color);
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
		.title {
			--bulma-title-color: var(--channelle-menu-text-color);
			--bulma-body-color: var(--channelle-menu-text-color);
		}
		background-color: var(--channelle-menu-bg-color);
		padding: 8px;
		z-index: 3;
		color: var(--channelle-menu-text-color);
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
			color: var(--channelle-menu-text-color);
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
