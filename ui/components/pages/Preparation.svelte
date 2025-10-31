<script lang="ts">
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";
	import { openInstruments } from "~/stores/instruments";
	import { getStage, currentStageStore } from "~/api/stage";
	import type { PublicStageDataResponse } from "~/types/serverSideTypes";

	import AccessInstrument from "~/components/instruments/AccessInstrument.svelte";
	import ChatInstrument from "~/components/instruments/ChatInstrument.svelte";
	import MediaLibraryInstrument from "~/components/instruments/MediaLibraryInstrument.svelte";
	import SceneSelectorInstrument from "~/components/instruments/SceneSelectorInstrument.svelte";

	import IconCheckCircle from "~/components/icons/Icon-check-circle.svelte";
	import IconCircle from "~/components/icons/Icon-circle.svelte";
	import IconKey from "~/components/icons/Icon-key.svelte";
	import IconLayers from "~/components/icons/Icon-layers.svelte";
	import IconMessageCircle from "~/components/icons/Icon-message-circle.svelte";

	import logoSrc from "~/assets/images/redrose.gif";

	let currentStage: PublicStageDataResponse | null = null;
	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		// Get show ID from URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const showId = urlParams.get("show");

		if (showId) {
			try {
				const stageId = parseInt(showId, 10);
				if (!isNaN(stageId)) {
					// Store stage ID in session storage for persistence
					sessionStorage.setItem("currentStageId", stageId.toString());

					currentStage = await getStage(stageId);
					if (!currentStage) {
						error = `Stage with ID ${stageId} not found`;
					} else {
						// Update the global current stage store
						currentStageStore.set(currentStage);
					}
				} else {
					error = "Invalid stage ID format";
				}
			} catch (err) {
				error = err instanceof Error ? err.message : "Failed to load stage data";
				console.error("Error loading stage:", err);
			}
		} else {
			// Check if we have a stage ID in session storage
			const storedStageId = sessionStorage.getItem("currentStageId");
			if (storedStageId) {
				try {
					const stageId = parseInt(storedStageId, 10);
					if (!isNaN(stageId)) {
						currentStage = await getStage(stageId);
						if (!currentStage) {
							error = `Stage with ID ${stageId} not found`;
						} else {
							currentStageStore.set(currentStage);
						}
					} else {
						error = "Invalid stored stage ID format";
					}
				} catch (err) {
					error = err instanceof Error ? err.message : "Failed to load stored stage data";
					console.error("Error loading stored stage:", err);
				}
			} else {
				error = "No stage ID specified in URL";
			}
		}

		loading = false;
	});
</script>

<main in:blur={{ delay: 500, duration: 1000 }}>
	<!-- Header -->
	<div class="image-container has-text-centered header" style="height:100px" in:blur={{ duration: 5000, delay: 2000 }}>
		<img src={logoSrc} alt="logotyp" class="mt-3 mb-0" style="height:80px" />
	</div>
	<div class="has-text-centered mb-4" in:blur={{ duration: 500, delay: 1000 }}>
		<h1 class="title is-4 has-text-white">Förberedelser</h1>
		{#if loading}
			<p class="subtitle is-6 has-text-grey">Laddar scendata...</p>
		{:else if error}
			<p class="subtitle is-6 has-text-danger">{error}</p>
		{:else if currentStage}
			<p class="subtitle is-6 has-text-grey">Konfigurera scenen "{currentStage.name}" innan lansering</p>
		{:else}
			<p class="subtitle is-6 has-text-grey">Konfigurera scenen innan lansering</p>
		{/if}
	</div>

	{#if loading}
		<div class="has-text-centered" style="margin-top: 2rem;">
			<div class="is-loading"></div>
		</div>
	{:else if error}
		<div class="notification is-danger is-light" style="margin: 2rem;">
			<p class="has-text-centered">{error}</p>
			<div class="has-text-centered" style="margin-top: 1rem;">
				<a href="/" class="button is-secondary">Tillbaka till teatern</a>
			</div>
		</div>
	{:else if currentStage}
		<div class="tabs is-light is-boxed is-centered mb-0" in:blur={{ duration: 100 }}>
			<ul>
				<li class:is-active={$openInstruments["scene-settings"]}>
					<a on:click={() => openInstruments.toggle("scene-settings")}
						><span class="icon"><IconLayers /></span> Scenen
						<span class="icon">
							{#if $openInstruments["scene-settings"]}
								<IconCheckCircle />
							{:else}
								<IconCircle />
							{/if}
						</span></a
					>
				</li>
				<li class:is-active={$openInstruments["chat"]}>
					<a on:click={() => openInstruments.toggle("chat")}
						><span class="icon"><IconMessageCircle /></span>
						Chatt<span class="icon"
							>{#if $openInstruments["chat"]}
								<IconCheckCircle />
							{:else}
								<IconCircle />
							{/if}</span
						></a
					>
				</li>
				<li class:is-active={$openInstruments["access"]}>
					<a on:click={() => openInstruments.toggle("access")}
						><span class="icon"><IconKey /></span>
						Tillgång<span class="icon"
							>{#if $openInstruments["access"]}
								<IconCheckCircle />
							{:else}
								<IconCircle />
							{/if}</span
						></a
					>
				</li>
				<!-- <li class:is-active={$openInstruments['media-library']}>
				<a on:click={() => openInstruments.toggle('media-library')}
					><span class="icon"><IconImage/></span>
					Mediabibliotek<span class="icon"
						>{#if $openInstruments['media-library']}
							<IconCheckCircle />
						{:else}
							<IconCircle />
						{/if}</span
					></a
				>
			</li> -->
			</ul>
		</div>
		<!-- Content -->
		<div in:blur={{ delay: 0, duration: 1000 }} class={`instruments instrument-cols-${Object.values($openInstruments).length}`}>
			{#if $openInstruments["scene-settings"]}
				<div class="instrument">
					<SceneSelectorInstrument />
				</div>
			{/if}
			{#if $openInstruments["chat"]}
				<div class="instrument">
					<ChatInstrument />
				</div>
			{/if}
			{#if $openInstruments["access"]}
				<div class="instrument">
					<AccessInstrument />
				</div>
			{/if}
			{#if $openInstruments["media-library"]}
				<div class="instrument">
					<MediaLibraryInstrument />
				</div>
			{/if}
		</div>
	{/if}
</main>

<style>
	main {
		background-color: var(--channelle-main-bg-color);
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.instruments,
	.instrument {
		background-color: var(--channelle-backstage-bg-color);
	}
	.instrument-cols-0 {
		background-color: var(--channelle-main-bg-color);
		height: 0;
		flex-grow: 0;
	}

	li a {
		color: var(--channelle-main-text-color);
	}
	li:hover a,
	li.is-active a {
		border-color: var(--channelle-backstage-text-color);
		color: var(--channelle-backstage-text-color);
		background-color: var(--channelle-backstage-bg-color);
	}
	.tabs ul {
		border-color: var(--channelle-backstage-text-color);
		border-bottom: none;
	}

	.header,
	.tabs {
		background-color: var(--channelle-main-bg-color);
		padding: 0;
		display: block;
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 1;
	}

	.tabs {
		z-index: 10;
		/* box-shadow: 0px 20px 10px rgb(20, 22, 26); */
	}

	.instruments {
		flex-grow: 1;
		display: flex;
		flex-direction: row;
		overflow: hidden;
	}

	.instrument-cols-1 {
		margin-left: 20%;
		margin-right: 20%;
	}
	.instrument-cols-2 {
		margin-left: 10%;
		margin-right: 10%;
	}
	.instrument-cols-3 {
		margin-left: 5%;
		margin-right: 5%;
	}

	.instrument {
		flex: 1; /* Ensure they shrink/grow evenly */
		margin: 10px;
		padding: 10px;
		padding-top: 20px;
		padding-bottom: 20px;
		overflow-y: auto; /* Makes each pane scrollable */
	}
</style>
