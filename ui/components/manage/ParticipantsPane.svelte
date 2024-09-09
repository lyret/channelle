<script lang="ts">
	import { createDatabaseStore } from '~/stores';
	import ParticipantsControl from './ParticipantsControl.svelte';

	const participants = createDatabaseStore('participant');
	$: participantsWithName = $participants.filter((p) => p.name && !p.blocked);
	$: managers = participantsWithName.filter((p) => p.manager);
	$: actors = participantsWithName.filter((p) => p.actor);
	$: visitors = participantsWithName.filter(
		(p) => !p.manager && !p.actor && !p.blocked
	);
	$: blocked = $participants.filter((p) => p.blocked && p.name);
</script>

<div class="notification">
	<h1 class="title is-size-3">Deltagare</h1>
	{#if managers.length}
		<h2 class="title is-size-6 mb-3 mt-4">Tekniker</h2>
		{#each managers as participant}
			<ParticipantsControl {participant} />
		{/each}
	{/if}
	{#if actors.length}
		<h2 class="title is-size-6 mb-3 mt-8">Skådespelare</h2>
		{#each actors as participant}
			<ParticipantsControl {participant} />
		{/each}
	{/if}
	{#if visitors.length}
		<h2 class="title is-size-6 mb-3 mt-8">Besökare</h2>
		{#each visitors as participant}
			<ParticipantsControl {participant} />
		{/each}
	{/if}
	{#if blocked.length}
		<h2 class="title is-size-6 mb-3 mt-8">Blockerade</h2>
		{#each blocked as participant}
			<ParticipantsControl {participant} />
		{/each}
	{/if}
</div>
