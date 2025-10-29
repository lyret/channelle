<script lang="ts">
	import StageListEntry from "~/components/StageListEntry.svelte";

	export let stages: Array<{
		name: string;
		url: string;
		isOnline: boolean;
		participantCount: number;
		description: string;
	}> = [];
</script>

<div class="box">
	<h3 class="title is-4 is-family-title">Available Stages</h3>
	{#each stages as stage}
		<StageListEntry
			stageName={stage.name}
			stageUrl={stage.url}
			isOnline={stage.isOnline}
			participantCount={stage.participantCount}
			description={stage.description}
		/>
	{/each}
	{#if stages.length === 0}
		<div class="notification is-light">
			<p class="is-family-secondary has-text-grey">No stages available at the moment.</p>
		</div>
	{/if}
</div>
