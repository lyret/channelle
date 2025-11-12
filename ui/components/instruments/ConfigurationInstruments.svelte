<script lang="ts">
	import { blur } from "svelte/transition";
	import { openInstruments } from "~/stores/instruments";

	import AccessInstrument from "./AccessInstrument.svelte";
	import ChatInstrument from "./ChatInstrument.svelte";
	import MediaLibraryInstrument from "./MediaLibraryInstrument.svelte";
	import ParticipantsInstrument from "./ParticipantsInstrument.svelte";
	import SceneSelectorInstrument from "./SceneSelectorInstrument.svelte";
	import ShowMetadataInstrument from "./ShowMetadataInstrument.svelte";

	import IconCheckCircle from "../icons/Icon-check-circle.svelte";
	import IconCircle from "../icons/Icon-circle.svelte";
	import IconKey from "../icons/Icon-key.svelte";
	import IconLayers from "../icons/Icon-layers.svelte";
	import IconMessageCircle from "../icons/Icon-message-circle.svelte";
	import IconUsers from "../icons/Icon-users.svelte";
	import IconImage from "../icons/Icon-image.svelte";
	import IconInfo from "../icons/Icon-info.svelte";

	// Props for customizing which instruments to show
	export let showParticipants = false;
	export let showMediaLibrary = false;
</script>

<div class="tabs-container" in:blur={{ duration: 100 }}>
	<div class="tab-line left-line"></div>
	<div class="tabs is-light is-boxed is-centered mb-0">
		<ul>
			<li class:is-active={$openInstruments["show-metadata"]}>
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<a on:click={() => openInstruments.toggle("show-metadata")}>
					<span class="icon"><IconInfo /></span> Info
					<span class="icon">
						{#if $openInstruments["show-metadata"]}
							<IconCheckCircle />
						{:else}
							<IconCircle />
						{/if}
					</span>
				</a>
			</li>
			<li class:is-active={$openInstruments["scene-settings"]}>
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<a on:click={() => openInstruments.toggle("scene-settings")}>
					<span class="icon"><IconLayers /></span> Scenen
					<span class="icon">
						{#if $openInstruments["scene-settings"]}
							<IconCheckCircle />
						{:else}
							<IconCircle />
						{/if}
					</span>
				</a>
			</li>
			{#if showParticipants}
				<li class:is-active={$openInstruments["participants"]}>
					<!-- svelte-ignore a11y-missing-attribute -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<a on:click={() => openInstruments.toggle("participants")}>
						<span class="icon"><IconUsers /></span>
						Deltagare
						<span class="icon">
							{#if $openInstruments["participants"]}
								<IconCheckCircle />
							{:else}
								<IconCircle />
							{/if}
						</span>
					</a>
				</li>
			{/if}
			<li class:is-active={$openInstruments["chat"]}>
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<a on:click={() => openInstruments.toggle("chat")}>
					<span class="icon"><IconMessageCircle /></span>
					{#if CONFIG.runtime.theater}
						Diskussion
					{:else}
						Chatt
					{/if}
					<span class="icon">
						{#if $openInstruments["chat"]}
							<IconCheckCircle />
						{:else}
							<IconCircle />
						{/if}
					</span>
				</a>
			</li>
			<li class:is-active={$openInstruments["access"]}>
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<a on:click={() => openInstruments.toggle("access")}>
					<span class="icon"><IconKey /></span>
					Tillgång
					<span class="icon">
						{#if $openInstruments["access"]}
							<IconCheckCircle />
						{:else}
							<IconCircle />
						{/if}
					</span>
				</a>
			</li>
			{#if showMediaLibrary}
				<li class:is-active={$openInstruments["media-library"]}>
					<!-- svelte-ignore a11y-missing-attribute -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<a on:click={() => openInstruments.toggle("media-library")}>
						<span class="icon"><IconImage /></span>
						Mediabibliotek
						<span class="icon">
							{#if $openInstruments["media-library"]}
								<IconCheckCircle />
							{:else}
								<IconCircle />
							{/if}
						</span>
					</a>
				</li>
			{/if}
		</ul>
	</div>
	<div class="tab-line right-line"></div>
</div>

<!-- Instrument Content -->
<div in:blur={{ delay: 0, duration: 1000 }} class={`instruments instrument-cols-${Object.values($openInstruments).length}`}>
	{#if $openInstruments["show-metadata"]}
		<div class="instrument">
			<ShowMetadataInstrument />
		</div>
	{/if}
	{#if $openInstruments["scene-settings"]}
		<div class="instrument">
			<SceneSelectorInstrument />
		</div>
	{/if}
	{#if showParticipants && $openInstruments["participants"]}
		<div class="instrument">
			<ParticipantsInstrument />
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
	{#if showMediaLibrary && $openInstruments["media-library"]}
		<div class="instrument">
			<MediaLibraryInstrument />
		</div>
	{/if}
</div>

<style>
	.instruments,
	.instrument {
		background-color: var(--channelle-backstage-bg-color);
	}
	.instrument-cols-0 {
		background-color: var(--channelle-main-bg-color);
		height: 0;
		flex-grow: 0;
	}

	li {
	}

	li a {
		border-bottom: 2px solid white;
		z-index: 3;
	}
	li:hover a,
	li.is-active a {
		color: var(--channelle-backstage-text-color);
		background-color: var(--channelle-backstage-bg-color);
		border-color: var(--channelle-backstage-text-color);
		color: var(--channelle-main-text-color);
		border-bottom: none;
	}
	.tabs ul {
		border-color: var(--channelle-backstage-text-color);
		border-bottom: none;
	}

	.tabs-container {
		display: flex;
		align-items: flex-end;
		background-color: var(--channelle-main-bg-color);
	}

	.tab-line {
		height: 1px;
		background-color: white;
		flex: 1;
	}

	.left-line {
		margin-right: 0px;
	}

	.right-line {
		margin-left: 0px;
	}

	.tabs {
		background-color: var(--channelle-main-bg-color);
		padding: 0;
		display: block;
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: auto;
		z-index: 10;
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
