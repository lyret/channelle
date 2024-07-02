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

<h1 class="title is-size-3">Deltagare</h1>
{#if managers.length}
	<h2 class="title is-size-6 mb-0 mt-4">Tekniker</h2>
	{#each managers as participant}
		<ParticipantsControl {participant} />
		<br />
	{/each}
{/if}
{#if actors.length}
	<h2 class="title is-size-6 mb-0 mt-4">Skådespelare</h2>
	{#each actors as participant}
		<div class="level">
			<div class="level-item">
				<ParticipantsControl {participant} />
			</div>
			<div class="buttons has-addons level-item">
				<button class="button">
					<span class="icon">
						<ion-icon name="videocam-off"></ion-icon>
					</span>
				</button>
				<button class="button">
					<span class="icon">
						<ion-icon name="volume-mute"></ion-icon>
					</span>
				</button>
			</div>
		</div>
	{/each}
{/if}
{#if visitors.length}
	<h2 class="title is-size-6 mb-0 mt-4">Besökare</h2>
	{#each visitors as participant}
		<ParticipantsControl {participant} />
		<br />
	{/each}
{/if}
{#if blocked.length}
	<h2 class="title is-size-6 mb-0 mt-4">Blockerade</h2>
	{#each blocked as participant}
		<ParticipantsControl {participant} />
		<br />
	{/each}
{/if}
