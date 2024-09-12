<script lang="ts">
	import { blur } from 'svelte/transition';
	import { openPanels, togglePanel } from '~/stores/ui';
	import { currentParticipant } from '~/stores/connection';
	import flowerSrc from '../assets/images/flower.png';
	import ChatList from '~/components/chat/ChatList.svelte';
	import ParticipantsInstrument from '~/components/instruments/ParticipantsInstrument.svelte';
	import SceneSelectorInstrument from '~/components/instruments/SceneSelectorInstrument.svelte';
	import MediaLibraryInstrument from '~/components/instruments/MediaLibraryInstrument.svelte';
</script>

<main>
	<!-- Header -->
	<div
		class="image-container has-text-centered header"
		style="height:100px"
		in:blur={{ duration: 5000, delay: 2000 }}
	>
		<img src={flowerSrc} alt="logotyp" class="mt-3 mb-0" style="height:80px" />
	</div>
	<div class="tabs is-centered mb-0" in:blur={{ duration: 100 }}>
		<ul>
			<li>
				<span
					class="is-flowers has-text-primary has-text-centered is-size-4 is-hidden-touch"
					>s t i n a o c h v i k</span
				>
			</li>
			<li class:is-active={$openPanels['scenes']}>
				<a on:click={() => togglePanel('scenes')}
					><span class="icon"><ion-icon name="albums"></ion-icon></span> Scenen
					<span class="icon"
						><ion-icon
							name={$openPanels['scenes']
								? 'checkmark-circle-outline'
								: 'ellipse-outline'}
						></ion-icon></span
					></a
				>
			</li>
			<li class:is-active={$openPanels['participants']}>
				<a on:click={() => togglePanel('participants')}
					><span class="icon"><ion-icon name="accessibility"></ion-icon></span>
					Deltagare
					<span class="icon"
						><ion-icon
							name={$openPanels['participants']
								? 'checkmark-circle-outline'
								: 'ellipse-outline'}
						></ion-icon></span
					></a
				>
			</li>
			<li class:is-active={$openPanels['chatt']}>
				<a on:click={() => togglePanel('chatt')}
					><span class="icon"
						><ion-icon name="chatbox-ellipses"></ion-icon></span
					>
					Chatt<span class="icon"
						><ion-icon
							name={$openPanels['chatt']
								? 'checkmark-circle-outline'
								: 'ellipse-outline'}
						></ion-icon></span
					></a
				>
			</li>
			<li class:is-active={$openPanels['medialibrary']}>
				<a on:click={() => togglePanel('medialibrary')}
					><span class="icon"><ion-icon name="images-outline"></ion-icon></span>
					Mediabibliotek<span class="icon"
						><ion-icon
							name={$openPanels['medialibrary']
								? 'checkmark-circle-outline'
								: 'ellipse-outline'}
						></ion-icon></span
					></a
				>
			</li>
			<li>
				<span
					class="is-flowers has-text-primary has-text-centered is-size-4 is-hidden-touch"
					>t o r o c h e b b a</span
				>
			</li>
		</ul>
	</div>
	<!-- Content -->
	<div
		in:blur={{ delay: 0, duration: 1000 }}
		class={`instruments instrument-cols-${Object.values($openPanels).length}`}
	>
		{#if $openPanels['scenes']}
			<div class="instrument">
				<SceneSelectorInstrument />
			</div>
		{/if}
		{#if $openPanels['participants']}
			<div class="instrument">
				<ParticipantsInstrument />
			</div>
		{/if}
		{#if $openPanels['chatt']}
			<div class="instrument">
				<ChatList />
			</div>
		{/if}
		{#if $openPanels['medialibrary']}
			<div class="instrument">
				<MediaLibraryInstrument />
			</div>
		{/if}
	</div>
	<div class="footer">
		<span class="is-flowers has-text-primary has-text-centered is-size-4">
			a b c d e f g h i j k l m n o p q r s t u v w x y z y x w v u t s r q p o
			m n l k j i h g f e
		</span>
	</div>
</main>

<style>
	main {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.header,
	.tabs,
	.footer {
		background-color: black;
		padding: 0;
		display: block;
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 1;
	}

	.tabs {
		z-index: 10;
		box-shadow: 0px 20px 10px black;
	}

	.footer {
		border-top: 1px solid var(--bulma-border);
		z-index: 10;
		box-shadow: 0px -10px 10px black;
		width: 100vw;
		overflow: hidden;
		-webkit-font-smoothing: antialiased;
	}
	.footer span {
		display: block;
		width: auto;
		padding-bottom: 20px;
		white-space: nowrap;
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
