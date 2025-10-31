<script lang="ts">
	import { isTheaterAuthenticated } from "~/stores/theaterAuth";
	import PicolEdit from "./picol/icons/Picol-edit.svelte";
	import PicolControlsPlay from "./picol/icons/Picol-controls-play.svelte";
	import PicolArrowFullUpperright from "./picol/icons/Picol-arrow-full-upperright.svelte";

	export let stageName: string;
	export let stageUrl: string;
	export let isOnline: boolean = true;
	export let description: string = "";

	function handleViewStage() {
		window.open(stageUrl, "_blank");
	}
</script>

<div class="notification" class:online={isOnline}>
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
				<div class="buttons">
					{#if isOnline}
						<a href={stageUrl} target="_blank" class="button is-small is-secondary">
							Öppna&nbsp;&nbsp;
							<span class="icon is-small">
								<PicolArrowFullUpperright />
							</span>
						</a>
					{:else if $isTheaterAuthenticated}
						<button class="button is-small is-secondary" on:click={handleViewStage}
							>Förbered&nbsp;&nbsp;
							<span class="icon is-small">
								<PicolEdit />
							</span></button
						>
						<button class="button is-small is-secondary" on:click={handleViewStage}
							>Lansera&nbsp;&nbsp;
							<span class="icon is-small">
								<PicolControlsPlay />
							</span></button
						>
					{/if}
				</div>
			</div>
			<div class="level-item">
				<div class="tags">
					<span class="tag" class:is-success={isOnline} class:is-dark={!isOnline}>
						{isOnline ? "Online" : "Offline"}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.notification {
		border-top-left-radius: 28px;
		border-top-right-radius: 28px;
		border-bottom-left-radius: 28px;
		border-bottom-right-radius: 0px;
	}
	.notification.online {
		border-top-left-radius: 28px;
		border-top-right-radius: 28px;
		border-bottom-left-radius: 0px;
		border-bottom-right-radius: 28px;
	}
</style>
