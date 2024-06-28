<script lang="ts">
	import { blur } from "svelte/transition";
	import { openPanels } from "~/stores/ui";
	import Header from "../components/content/Header.svelte";
	import ParticipantsList from "../components/ParticipantsList.svelte";
</script>

<!-- Header -->
<Header />
<!-- Content -->
<main class="p-3 container is-widescreen" in:blur={{ delay: 0, duration: 1000 }}>
	<div class="columns">
		{#if $openPanels["live"]}
			<div class="column">Live</div>
		{/if}
		{#if $openPanels["scenes"]}
			<div class="column">Scenes</div>
		{/if}
		{#if $openPanels["participants"]}
			<div class="column">
				<ParticipantsList/>
			</div>
		{/if}
		{#if $openPanels["chatt"]}
			<div class="column">Chatt</div>
		{/if}
	</div>
</main>
<div class="is-hidden-touch">
	<div style="border-bottom: 1px solid hsl(0, 0%, 86%); width: 100vw; -webkit-font-smoothing: antialiased;"/>
	<p class="is-plants has-text-centered is-size-4">a b c d e f g h i j k l m n o p q r s t u v w x y z y x w v u t s r q p o m n l k j i h g f e</p>
</div>