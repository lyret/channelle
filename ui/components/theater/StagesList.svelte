<script lang="ts">
	import StageListEntry from "~/components/StageListEntry.svelte";
	import { stagesStore } from "~/api/stage";
</script>

<div class="box">
	{#each $stagesStore as stage (stage.url)}
		<StageListEntry
			stageName={stage.name}
			stageUrl={stage.url}
			isOnline={stage.isOnline}
			participantCount={stage.participantCount}
			description={stage.description}
		/>
	{/each}
	{#if $stagesStore.length === 0}
		<div class="notification is-light">
			<p class="is-family-secondary has-text-grey">Det finns inga föreställningar att visa just nu.</p>
		</div>
	{/if}
</div>

<style>
	.box {
		margin-top: 4rem;
	}
</style>
