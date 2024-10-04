<script lang="ts">
	import { blur } from 'svelte/transition';
	import ChatInstrument from '~/components/instruments/ChatInstrument.svelte';
	import ParticipantsInstrument from '~/components/instruments/ParticipantsInstrument.svelte';
	import SceneSelectorInstrument from '~/components/instruments/SceneSelectorInstrument.svelte';
	import MediaLibraryInstrument from '~/components/instruments/MediaLibraryInstrument.svelte';
	import AccessInstrument from '../instruments/AccessInstrument.svelte';
	import { focusedInstrument } from '~/stores/ui';
</script>

<!-- <ParticipantsInstrument /> -->

<!-- <main in:blur={{ delay: 500, duration: 1000 }}>
	
<!-- Content -->
{#if $focusedInstrument == 'scene-settings'}
	<div class="instrument-control">
		<a on:click={() => ($focusedInstrument = undefined)}>
			<span class="icon"><ion-icon name="close"></ion-icon></span>
		</a>
	</div>
	<div class="instrument">
		<SceneSelectorInstrument />
	</div>
{:else if $focusedInstrument == 'participants'}
	<div class="instrument-control">
		<a on:click={() => ($focusedInstrument = undefined)}>
			<span class="icon"><ion-icon name="close"></ion-icon></span>
		</a>
	</div>
	<div class="instrument">
		<ParticipantsInstrument />
	</div>
{:else if $focusedInstrument == 'chat'}
	<div class="instrument-control">
		<a on:click={() => ($focusedInstrument = undefined)}>
			<span class="icon"><ion-icon name="close"></ion-icon></span>
		</a>
	</div>
	<div class="instrument">
		<ChatInstrument />
	</div>
{:else if $focusedInstrument == 'access'}
	<div class="instrument-control">
		<a on:click={() => ($focusedInstrument = undefined)}>
			<span class="icon"><ion-icon name="close"></ion-icon></span>
		</a>
	</div>
	<div class="instrument">
		<AccessInstrument />
	</div>
{:else if $focusedInstrument == 'media-library'}
	<div class="instrument-control">
		<a on:click={() => ($focusedInstrument = undefined)}>
			<span class="icon"><ion-icon name="close"></ion-icon></span>
		</a>
	</div>
	<div class="instrument">
		<MediaLibraryInstrument />
	</div>
{:else}
	<div class="select-view mb-4" in:blur={{ duration: 100 }}>
		<button
			class="button is-fullwidth mb-4 is-small"
			on:click={() => ($focusedInstrument = 'scene-settings')}
			><span class="icon is-size-3"><ion-icon name="albums"></ion-icon></span>
			<span>Sceninställningar</span></button
		>
		<hr />
		<button
			class="button is-fullwidth mb-4 is-small"
			on:click={() => ($focusedInstrument = 'access')}
			><span class="icon is-size-3"><ion-icon name="key"></ion-icon></span>
			<span>Tillgång</span></button
		>
		<hr />
		<button
			class="button is-fullwidth mb-4 is-small"
			on:click={() => ($focusedInstrument = 'participants')}
			><span class="icon is-size-3"
				><ion-icon name="accessibility"></ion-icon></span
			>
			<span>Deltagare</span></button
		>
		<hr />
		<button
			class="button is-fullwidth mb-4 is-small"
			on:click={() => ($focusedInstrument = 'chat')}
			><span class="icon is-size-3"
				><ion-icon name="chatbox-ellipses"></ion-icon></span
			>
			<span>Chatt</span></button
		>
		<hr />
		<a class="button is-fullwidth is-small" href="/backstage" target="_blank">
			<span class="icon is-size-3"
				><ion-icon name="arrow-forward-circle-outline"></ion-icon></span
			>
			<span>Gå Backstage </span>
		</a>
	</div>
{/if}

<style>
	.instrument-control {
		position: absolute;
		font-size: 3em;
		top: 8px;
		right: 24px;
	}
	.instrument {
		padding-top: 24px;
	}

	.select-view {
		position: absolute;
		bottom: 24px;
		left: 24px;
		right: 24px;
	}
	.select-view .button {
		justify-content: start;
		border-width: 0;
	}
</style>
