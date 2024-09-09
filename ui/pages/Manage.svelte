<script lang="ts">
	import { blur } from 'svelte/transition';
	import { openPanels, togglePanel } from '~/stores/ui';
	import { currentParticipant } from '~/stores/connection';
	import flowerSrc from '../assets/images/flower.png';
	import ChatList from '~/components/chat/ChatList.svelte';
	import ParticipantsList from '~/components/manage/ParticipantsPane.svelte';
	import SceneSelector from '~/components/manage/SceneSelector.svelte';
	import MediaLibraryPane from '~/components/manage/MediaLibraryPane.svelte';
</script>

<main>
	<!-- Header -->
	<div
		class="image-container has-text-centered header"
		style="height:120px"
		in:blur={{ duration: 5000, delay: 2000 }}
	>
		<img src={flowerSrc} alt="logotyp" class="mt-2" style="height:80px" />
		<p>Channelle: {$currentParticipant.name}</p>
	</div>
	<div class="tabs is-centered mb-0" in:blur={{ duration: 100 }}>
		<ul>
			<li>
				<span class="is-plants has-text-centered is-size-4 is-hidden-touch"
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
				<span class="is-plants has-text-centered is-size-4 is-hidden-touch"
					>t o r o c h e b b a</span
				>
			</li>
		</ul>
	</div>
	<!-- Content -->
	<div in:blur={{ delay: 0, duration: 1000 }} class="panes">
		{#if $openPanels['scenes']}
			<div class="pane">
				<SceneSelector />
			</div>
		{/if}
		{#if $openPanels['participants']}
			<div class="pane">
				<ParticipantsList />
			</div>
		{/if}
		{#if $openPanels['chatt']}
			<div class="pane">
				<ChatList />
			</div>
		{/if}
		{#if $openPanels['medialibrary']}
			<div class="pane">
				<MediaLibraryPane />
			</div>
		{/if}
	</div>
	<div class="footer is-hidden-touch">
		<div
			style="border-bottom: 1px solid hsl(0, 0%, 86%); width: 100vw; -webkit-font-smoothing: antialiased;"
		/>
		<p class="is-plants has-text-centered is-size-4">
			a b c d e f g h i j k l m n o p q r s t u v w x y z y x w v u t s r q p o
			m n l k j i h g f e
		</p>
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
		display: block;
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 1;
	}

	.panes {
		flex-grow: 1;
		display: flex;
		flex-direction: row;
		overflow: hidden;
	}

	.pane {
		flex: 1; /* Ensure they shrink/grow evenly */
		margin: 10px;
		padding: 10px;
		overflow-y: auto; /* Makes each pane scrollable */
	}
</style>
