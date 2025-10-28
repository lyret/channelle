<script lang="ts">
	import { blur } from "svelte/transition";
	import logoSrc from "~/assets/images/logo-smoker-free.gif";

	import AccessInstrument from "~/components/instruments/AccessInstrument.svelte";
	import DebugInstrument from "~/components/instruments/DebugInstrument.svelte";
	import MediaLibraryInstrument from "~/components/instruments/MediaLibraryInstrument.svelte";
	import ParticipantsInstrument from "~/components/instruments/ParticipantsInstrument.svelte";
	import SceneSelectorInstrument from "~/components/instruments/SceneSelectorInstrument.svelte";
	import MediaInputSelector from "./_MediaInputSelector.svelte";

	import IconActivity from "../../icons/Icon-activity.svelte";
	import IconExternalLink from "../../icons/Icon-external-link.svelte";
	import IconKey from "../../icons/Icon-key.svelte";
	import IconLayers from "../../icons/Icon-layers.svelte";
	import IconUsers from "../../icons/Icon-users.svelte";
	import IconXCircle from "../../icons/Icon-x-circle.svelte";

	import { peerStore } from "~/api/room";
	import { focusedInstrument } from "~/stores/instruments";
</script>

<!-- Common Contents -->
<img src={logoSrc} class="logo" />
<MediaInputSelector />

<!-- Manager Contents -->
{#if $peerStore.manager || CONFIG.runtime.debug}
	{#if $focusedInstrument}
		<div class="instrument-control">
			<a on:click={() => focusedInstrument.set(undefined)}>
				<span class="icon"><IconXCircle /></span>
			</a>
		</div>
		<div class="instrument">
			{#if $focusedInstrument == "debug"}
				<DebugInstrument />
			{:else if $focusedInstrument == "scene-settings"}
				<SceneSelectorInstrument />
			{:else if $focusedInstrument == "participants"}
				<ParticipantsInstrument />
			{:else if $focusedInstrument == "access"}
				<AccessInstrument />
			{:else if $focusedInstrument == "media-library"}
				<MediaLibraryInstrument />
			{/if}
		</div>
	{:else}
		<div class="select-view mb-4" in:blur={{ duration: 100 }}>
			{#if CONFIG.runtime.debug}
				<button class="button is-fullwidth mb-4 is-small" on:click={() => ($focusedInstrument = "debug")}
					><span class="icon is-size-5"><IconActivity /></span>
					<span>Debug Tools</span></button
				>
				<hr />
			{/if}
			{#if $peerStore.manager}
				<button class="button is-fullwidth mb-4 is-small" on:click={() => ($focusedInstrument = "debug")}
					><span class="icon is-size-5"><IconActivity /></span>
					<span>Avancerad information</span></button
				>
				<hr />
				<button class="button is-fullwidth mb-4 is-small" on:click={() => ($focusedInstrument = "scene-settings")}
					><span class="icon is-size-5"><IconLayers /></span>
					<span>Sceninställningar</span></button
				>
				<hr />
				<button class="button is-fullwidth mb-4 is-small" on:click={() => ($focusedInstrument = "access")}
					><span class="icon is-size-5"><IconKey /></span>
					<span>Tillgång</span></button
				>
				<hr />
				<button class="button is-fullwidth mb-4 is-small" on:click={() => ($focusedInstrument = "participants")}
					><span class="icon is-size-5"><IconUsers /></span>
					<span>Deltagare</span></button
				>
				<hr />
				<a class="button is-fullwidth is-small" href="/backstage" target="_blank">
					<span class="icon is-size-5"><IconExternalLink /></span>
					<span>Öppna Backstage</span>
				</a>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.logo {
		border-radius: 8px;
		margin-bottom: 24px;
	}
	.instrument-control {
		font-size: 3em;
		height: 24px;
		margin-bottom: -24px;
		margin-right: -10px;
		text-align: right;
	}
	.instrument {
		padding-top: 24px;
	}

	.select-view .button {
		justify-content: start;
		border-width: 0;
	}
</style>
