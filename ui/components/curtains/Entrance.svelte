<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte";
	import { get } from "svelte/store";
	import { updatePeer, currentPeerStore } from "~/api";
	import { showMetadataStore } from "~/api/backstage";
	import logoSrc from "~/assets/images/logo-smoker-free.gif";
	import IconArrowRight from "~/components/icons/Icon-arrow-right.svelte";

	const dispatch = createEventDispatcher<{ submit: void }>();

	let loading: boolean = false;
	let name: string = "";
	let showDescription: boolean = false;

	$: hasName = $currentPeerStore?.name;

	// Handle the submission
	async function onSubmit(e?: SubmitEvent) {
		if (e) e.preventDefault();

		// If user already has a name, just proceed
		if (hasName) {
			dispatch("submit");
			return;
		}

		// Otherwise, update their name first
		loading = true;
		await updatePeer(get(currentPeerStore).id, { name: name });
		dispatch("submit");
	}

	// Add random rotation effect on hover
	onMount(() => {
		document.querySelectorAll("a, .button").forEach((element) =>
			element.addEventListener("mouseenter", () => {
				document.documentElement.style.setProperty("--channelle-random-rotation", `rotate(${Math.floor(Math.random() * 6) - 4}deg)`);
			}),
		);
	});
</script>

<div class="entrance-container">
	<h1 class="title is-1">{$showMetadataStore.name}</h1>
	{#if showDescription}
		<div class="description-view">
			<h2 class="subtitle is-family-default">Om {$showMetadataStore.nomenclature || "föreställningen"}</h2>
			<p class="description">
				{$showMetadataStore.description || "Utan beskrivning..."}
			</p>
			<button class="button" on:click={() => (showDescription = false)}><span class="is-family-secondary">Tillbaka</span></button>
		</div>
	{:else}
		{#if hasName}
			<h2 class="subtitle is-family-default">
				Välkommen tillbaka <span class="is-family-secondary has-text-weight-bold">{$currentPeerStore.name}</span>!
			</h2>
			<button class="button main" on:click={() => onSubmit()}><span class="is-family-secondary has-text-weight-bold">GÅ IN</span></button>
		{:else}
			<h2 class="subtitle is-family-default">Skriv in ditt namn för att fortsätta</h2>
			<form on:submit={onSubmit} class="form">
				<input type="text" class="input" bind:value={name} placeholder="Ditt namn" class:is-disabled={loading} />
				<button type="submit" class="button main" class:is-loading={loading} disabled={!name}>
					<span class="is-family-secondary has-text-weight-bold">GÅ IN</span>
				</button>
			</form>
		{/if}
		{#if $showMetadataStore.description}
			<button class="button alt" on:click={() => (showDescription = true)}>
				<span class="is-family-default">Om {$showMetadataStore.nomenclature || "föreställningen"}</span>
			</button>
		{/if}
		<a
			class="button"
			href="https://docs.google.com/document/d/1DkEueBO6ILWhjywY7NSpKnVJfJv-g1RF5PzJcg9eFkE/edit?usp=sharing"
			target="_blank"
			rel="noopener"
		>
			<span class="is-family-default">Hur funkar det?</span>
		</a>
	{/if}

	<!-- Footer -->
	<div class="level">
		<div class="level-left">
			<div class="level-item">
				<img class="image" src={logoSrc} alt="Channelle" />
			</div>
		</div>
		<div class="level-right">
			<div class="level-item">
				Av&nbsp;<a
					href="https://www.facebook.com/people/Skärmteatern/100076254422586/"
					target="_blank"
					rel="noopener"
					class="is-family-secondary has-text-weight-bold">Skärmteatern</a
				>
			</div>
			<div class="level-item">
				&&nbsp;<a href="https://maskinrepubliken.se" target="_blank" rel="noopener" class="is-family-secondary has-text-weight-bold">Maskinrepubliken</a
				>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.image {
		width: 100%;
		max-height: 50px;
		object-fit: cover;
	}

	.level {
		margin-top: 2rem;
		width: 100%;
	}

	.entrance-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		min-height: 100%;
		width: 100%;
		overflow-x: hidden;
		padding: 0 18px;
	}

	.description-view {
		animation: fadeIn 0.3s ease-in;

		.description {
			margin: 1.5rem 0;
			font-size: 1.1rem;
			line-height: 1.6;
			text-align: left;
			max-height: 300px;
			overflow-y: auto;
			padding: 1rem;
			background: rgba(0, 0, 0, 0.1);
			border-radius: 8px;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.title {
		color: var(--channelle-menu-text-color);
		&.is-1 {
			font-size: clamp(24px, 3.5vw, 60px);
		}
		&.is-2 {
			font-size: clamp(20px, 3vw, 48px);
		}
		&.is-3 {
			font-size: clamp(18px, 2.5vw, 36px);
		}
		@include mobile {
			&.is-1 {
				font-size: clamp(24px, 7vw, 60px);
			}
			&.is-2 {
				font-size: clamp(20px, 6vw, 48px);
			}
			&.is-3 {
				font-size: clamp(18px, 5vw, 36px);
			}
		}
	}

	.subtitle {
		color: var(--channelle-menu-text-color);
		font-size: clamp(16px, 2vw, 24px);
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		@include mobile {
			font-size: clamp(16px, 4vw, 24px);
		}
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
		width: 100%;
		max-width: 400px;
	}

	.input {
		font-size: clamp(16px, 2vw, 24px);
		padding: 0.75rem 1rem;
		text-align: center;
		width: 100%;
		color: var(--channelle-menu-text-color);
		background: rgba(var(--bulma-scheme-main-rgb), 0.1);
		border: none;
		border-bottom: 2px solid var(--channelle-menu-bg-color);
		box-shadow: none;

		@include mobile {
			font-size: clamp(16px, 5vw, 24px);
		}

		&::placeholder {
			text-align: center;
			color: var(--channelle-menu-text-color);
			opacity: 0.7;
		}

		&:focus {
			border-bottom-color: var(--channelle-menu-text-color);
			box-shadow: none;
		}
	}

	.button {
		background: none !important;
		border: none;
		box-shadow: none;
		padding: 0.75rem 1.5rem;
		cursor: pointer;
		transition: transform 0.2s ease;

		span {
			font-weight: 700;
			color: var(--channelle-menu-text-color);
			font-size: clamp(16px, 2vw, 24px);
			display: inline-block;

			@include mobile {
				font-size: clamp(16px, 5vw, 24px);
			}
		}

		&.main span {
			font-weight: 800;
			font-size: clamp(18px, 2.5vw, 32px);
			text-decoration: underline;

			@include mobile {
				font-size: clamp(18px, 6vw, 32px);
			}
		}

		&.alt span {
			color: var(--channelle-menu-bg-color);
			background-color: var(--channelle-menu-text-color);
		}

		&:hover span {
			transform: var(--channelle-random-rotation);
			text-decoration: underline;
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;

			span {
				text-decoration: line-through;
			}
		}

		&.is-loading {
			span::after {
				content: "...";
				animation: loading 1s infinite;
			}
		}

		.icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			height: 1em;
			width: 1em;
			vertical-align: middle;
		}
	}

	@keyframes loading {
		0% {
			content: ".";
		}
		33% {
			content: "..";
		}
		66% {
			content: "...";
		}
	}

	.footer {
		width: 100%;
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin-top: 2rem;

		.footer-brand {
			.title {
				margin: 0;
			}
		}

		.footer-links {
			display: flex;
			gap: 1.5rem;

			a {
				display: block;
				font-size: 1.2rem;
				color: var(--channelle-menu-text-color);
				text-decoration: none;
				transition: transform 0.2s ease;

				&:hover {
					transform: var(--channelle-random-rotation);
					text-decoration: underline;
				}
			}
		}

		@include mobile {
			flex-direction: column;
			gap: 1rem;

			.footer-links {
				flex-direction: column;
				text-align: center;
				gap: 0.5rem;
			}
		}
	}
</style>
