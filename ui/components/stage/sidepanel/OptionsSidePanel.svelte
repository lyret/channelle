<script lang="ts">
	import { blur } from "svelte/transition";
	import logoSrc from "~/assets/images/logo-smoker-free.gif";

	import AccessInstrument from "~/components/instruments/AccessInstrument.svelte";
	import DebugInstrument from "~/components/instruments/DebugInstrument.svelte";
	import MediaLibraryInstrument from "~/components/instruments/MediaLibraryInstrument.svelte";
	import ParticipantsInstrument from "~/components/instruments/ParticipantsInstrument.svelte";
	import SceneSelectorInstrument from "~/components/instruments/SceneSelectorInstrument.svelte";
	import ScriptInstrument from "~/components/instruments/ScriptInstrument.svelte";
	import MediaInputSelector from "./_MediaInputSelector.svelte";
	import Accordion from "~/components/Accordion.svelte";
	import ForcedSettingsContent from "~/components/instruments/_ForcedSettingsContent.svelte";

	import IconAccess from "../../picol/icons/Picol-view.svelte";
	import IconScenes from "../../picol/icons/Picol-link.svelte";
	import IconUsers from "../../picol/icons/Picol-group-full.svelte";
	import IconScript from "../../picol/icons/Picol-script.svelte";

	import IconActivity from "../../icons/Icon-activity.svelte";
	import IconExternalLink from "../../icons/Icon-external-link.svelte";
	import IconMaximize from "../../icons/Icon-maximize.svelte";
	import IconMinimize from "../../icons/Icon-minimize.svelte";
	import PicolArrowLeft from "../../picol/icons/Picol-arrow-sans-left.svelte";

	import { currentPeerStore } from "~/api";
	import { focusedInstrument } from "~/stores/instruments";
	import { windowSizeStore, windowFullscreenStore } from "~/stores/device";

	const windowSize = windowSizeStore();
	const fullscreen = windowFullscreenStore();
	$: isMobile = $windowSize.width <= 842;
</script>

<!-- Common Contents -->
<img src={logoSrc} class="logo" />
<MediaInputSelector />
{#if $currentPeerStore.manager}
	<p class="label">Snabbval för dig som tekniker</p>
	<div class="mb-4">
		<Accordion title="Sceninställningar" isOpen={false}>
			<ForcedSettingsContent />
		</Accordion>
	</div>
{/if}

<!-- Manager Contents -->
{#if $currentPeerStore.manager}
	<p class="label">Kontrollpanel</p>
	{#if $focusedInstrument}
		<button class="button is-fullwidth mb-4 is-small close-button" on:click={() => focusedInstrument.set("")}>
			<span class="icon is-size-5"><PicolArrowLeft /></span>
			<span>Visa alla instrument</span>
		</button>
		<div class="instrument">
			{#if $focusedInstrument == "debug"}
				<DebugInstrument />
			{:else if $focusedInstrument == "scene-settings"}
				<SceneSelectorInstrument hideForcedSettings={true} />
			{:else if $focusedInstrument == "participants"}
				<ParticipantsInstrument />
			{:else if $focusedInstrument == "access"}
				<AccessInstrument />
			{:else if $focusedInstrument == "media-library"}
				<MediaLibraryInstrument />
			{:else if $focusedInstrument == "script"}
				<ScriptInstrument />
			{/if}
		</div>
	{:else}
		<div class="select-view mb-4" in:blur={{ duration: 100 }}>
			<button class="button is-fullwidth mb-4 is-small" on:click={() => ($focusedInstrument = "debug")}
				><span class="icon is-size-5"><IconActivity /></span>
				<span>Debug information</span></button
			>
			<hr />
			<button class="button is-fullwidth mb-4 is-small" on:click={() => ($focusedInstrument = "scene-settings")}
				><span class="icon is-size-5"><IconScenes /></span>
				<span>Sceninställningar</span></button
			>
			<hr />
			<!-- Fullscreen button for mobile -->
			{#if isMobile}
				<button
					class="button is-fullwidth mb-4 is-small"
					class:is-primary={$fullscreen}
					on:click={() => {
						fullscreen.toggle();
					}}
				>
					<span class="icon is-size-5">
						{#if $fullscreen}
							<IconMinimize />
						{:else}
							<IconMaximize />
						{/if}
					</span>
					<span>{$fullscreen ? "Avsluta fullskärm" : "Fullskärm"}</span>
				</button>
				<hr />
			{/if}
			<button class="button is-fullwidth mb-4 is-small" on:click={() => ($focusedInstrument = "access")}
				><span class="icon is-size-5"><IconAccess /></span>
				<span>Tillgång</span></button
			>
			<hr />
			<button class="button is-fullwidth mb-4 is-small" on:click={() => ($focusedInstrument = "participants")}
				><span class="icon is-size-5"><IconUsers /></span>
				<span>Deltagare</span></button
			>
			<hr />
			<button class="button is-fullwidth mb-4 is-small" on:click={() => ($focusedInstrument = "script")}
				><span class="icon is-size-5"><IconScript /></span>
				<span>Manuskript</span></button
			>
			<hr />
			<a class="button is-fullwidth is-small" href="/backstage" target="_blank">
				<span class="icon is-size-5"><IconExternalLink /></span>
				<span>Öppna Backstage</span>
			</a>
		</div>
	{/if}
{/if}

<style>
	.logo {
		border-radius: 8px;
		margin-bottom: 24px;
	}
	.instrument {
		padding-top: 0px;
	}

	.select-view .button,
	.close-button {
		justify-content: start;
		border-width: 0;
	}
	.label {
		text-align: center;
		font-weight: 400;
	}
</style>
