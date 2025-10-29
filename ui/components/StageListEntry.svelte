<script lang="ts">
	import IconExternalLink from "~/components/icons/Icon-external-link.svelte";
	import IconUsers from "~/components/icons/Icon-users.svelte";

	export let stageName: string;
	export let stageUrl: string;
	export let isOnline: boolean = true;
	export let participantCount: number = 0;
	export let description: string = "";

	function handleViewStage() {
		window.open(stageUrl, "_blank");
	}
</script>

<div class="notification is-light">
	<div class="level is-mobile">
		<div class="level-left">
			<div class="level-item">
				<div>
					<p class="title is-6 is-family-title">{stageName}</p>
					{#if description}
						<p class="subtitle is-7 is-family-secondary">{description}</p>
					{/if}
					<p class="is-size-7 has-text-grey">
						<code>{stageUrl}</code>
					</p>
				</div>
			</div>
		</div>
		<div class="level-right">
			<div class="level-item">
				<div class="tags">
					<span class="tag" class:is-success={isOnline} class:is-light={!isOnline}>
						{isOnline ? "Online" : "Offline"}
					</span>
					{#if participantCount > 0}
						<span class="tag is-info is-light">
							<span class="icon is-small">
								<IconUsers />
							</span>
							{participantCount}
						</span>
					{/if}
				</div>
			</div>
			<div class="level-item">
				<div class="buttons">
					<button
						class="button is-small is-primary"
						disabled={!isOnline}
						on:click={handleViewStage}
					>
						View
					</button>
					<a
						href={stageUrl}
						target="_blank"
						class="button is-small is-light"
						class:is-disabled={!isOnline}
					>
						<span class="icon is-small">
							<IconExternalLink />
						</span>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
