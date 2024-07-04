<script lang="ts">
	import { blur } from 'svelte/transition';
	import { openPanels } from '~/stores/ui';
	import Header from '~/components/manage/Header.svelte';
	import ChatList from '~/components/chat/ChatList.svelte';
	import ParticipantsList from '~/components/manage/ParticipantsList.svelte';
</script>

<!-- Header -->
<Header />
<!-- Content -->
<main
	class="p-3 container is-widescreen"
	in:blur={{ delay: 0, duration: 1000 }}
>
	<div class="grid">
		{#if $openPanels['live']}{/if}
		{#if $openPanels['scenes']}
			<div class="cell">
				<h1 class="subtitle">Scenes</h1>
				<div class="notification is-info">
					<div class="fixed-grid has-3-cols">
						<div class="grid">
							<div class="cell has-background-primary">1</div>
							<div class="cell">2</div>
							<div class="cell">3</div>
							<div class="cell">4</div>
							<div class="cell">5</div>
							<div class="cell">6</div>
						</div>
					</div>
				</div>
				<button class="button is-success is-fullwidth is-dark"
					><span class="icon"><ion-icon name="add-circle"></ion-icon></span
					><span>Lägg till scen</span></button
				>
			</div>
		{/if}
		{#if $openPanels['participants']}
			<div class="cell">
				<ParticipantsList />
			</div>
		{/if}
		{#if $openPanels['chatt']}
			<div class="cell">
				<ChatList />
			</div>
		{/if}
	</div>
</main>
<div class="is-hidden-touch">
	<div
		style="border-bottom: 1px solid hsl(0, 0%, 86%); width: 100vw; -webkit-font-smoothing: antialiased;"
	/>
	<p class="is-plants has-text-centered is-size-4">
		a b c d e f g h i j k l m n o p q r s t u v w x y z y x w v u t s r q p o m
		n l k j i h g f e
	</p>
</div>
