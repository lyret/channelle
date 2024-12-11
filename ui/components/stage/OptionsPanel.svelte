<script lang="ts">
	import { blur } from 'svelte/transition';
	import ChatInstrument from '~/components/instruments/ChatInstrument.svelte';
	import ParticipantsInstrument from '~/components/instruments/ParticipantsInstrument.svelte';
	import SceneSelectorInstrument from '~/components/instruments/SceneSelectorInstrument.svelte';
	import MediaLibraryInstrument from '~/components/instruments/MediaLibraryInstrument.svelte';
	import AccessInstrument from '../instruments/AccessInstrument.svelte';
	import { focusedInstrument } from '~/stores/ui';
	import MediaInputMenuInstrument from './menuInstruments/MediaInputMenuInstrument.svelte';
	import logoSrc from '~/assets/images/logo-smoker-free.gif';
	import { currentParticipant } from '~/lib/stores/api';
</script>

<!-- Common Contents -->
<img src={logoSrc} class="logo" />
<MediaInputMenuInstrument />

<!-- Manager Contents -->
{#if $currentParticipant.manager}
	{#if $focusedInstrument != undefined}
		<div class="instrument-control">
			<a on:click={() => ($focusedInstrument = undefined)}>
				<span class="icon"><ion-icon name="close"></ion-icon></span>
			</a>
		</div>
		<div class="instrument">
			{#if $focusedInstrument == 'scene-settings'}
				<SceneSelectorInstrument />
			{:else if $focusedInstrument == 'participants'}
				<ParticipantsInstrument />
			{:else if $focusedInstrument == 'access'}
				<AccessInstrument />
			{:else if $focusedInstrument == 'media-library'}
				<MediaLibraryInstrument />
			{/if}
		</div>
	{:else}
		<div class="select-view mb-4" in:blur={{ duration: 100 }}>
			<button
				class="button is-fullwidth mb-4 is-small"
				on:click={() => ($focusedInstrument = 'scene-settings')}
				><span class="icon is-size-5"><ion-icon name="albums"></ion-icon></span>
				<span>Sceninställningar</span></button
			>
			<hr />
			<button
				class="button is-fullwidth mb-4 is-small"
				on:click={() => ($focusedInstrument = 'access')}
				><span class="icon is-size-5"><ion-icon name="key"></ion-icon></span>
				<span>Tillgång</span></button
			>
			<hr />
			<button
				class="button is-fullwidth mb-4 is-small"
				on:click={() => ($focusedInstrument = 'participants')}
				><span class="icon is-size-5"
					><ion-icon name="accessibility"></ion-icon></span
				>
				<span>Deltagare</span></button
			>
			<hr />
			<a class="button is-fullwidth is-small" href="/backstage" target="_blank">
				<span class="icon is-size-5"
					><ion-icon name="arrow-forward-circle-outline"></ion-icon></span
				>
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
