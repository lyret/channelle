<script lang="ts">
	import { createAPIStore } from '~/stores';
	import ParticipantsControl from './ParticipantsControl.svelte';

	const participants = createAPIStore('participant');
	$: participantsWithName = $participants.filter((p) => p.name);
</script>

<h2 class="is-title">Participants</h2>
{#each participantsWithName as participant}
	<ParticipantsControl {participant} />
	<br />
{/each}
