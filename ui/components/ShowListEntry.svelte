<script lang="ts">
	import { isTheaterAuthenticated } from "~/stores/theaterAuth";
	import PicolEdit from "./picol/icons/Picol-edit.svelte";
	import PicolControlsPlay from "./picol/icons/Picol-controls-play.svelte";
	import PicolArrowFullUpperright from "./picol/icons/Picol-arrow-full-upperright.svelte";
	import type { ShowListItem } from "~/types/serverSideTypes";

	export let show: ShowListItem;

	function handleViewStage() {
		window.open(show.url, "_blank");
	}
</script>

<div class="notification" class:online={show.isOnline}>
	<div class="level is-mobile">
		<div class="level-left">
			<div class="level-item">
				<div>
					<p class="title is-6 is-family-title">
						{show.name}
						<span class="tag" class:is-success={show.isOnline} class:is-dark={!show.isOnline}>
							{show.isOnline ? "Online" : "Offline"}
						</span>
					</p>
					{#if show.description}
						<p class="subtitle is-7 is-family-secondary">{show.description}</p>
					{/if}
					<p class="is-size-7 has-text-grey">
						<code>{show.url}</code>
					</p>
				</div>
			</div>
		</div>
		<div class="level-right">
			<div class="level-item">
				<div class="buttons">
					{#if show.isOnline}
						<a href={show.url} target="_blank" class="button is-small is-secondary">
							Öppna&nbsp;&nbsp;
							<span class="icon is-small">
								<PicolArrowFullUpperright />
							</span>
						</a>
					{:else if $isTheaterAuthenticated}
						<a class="button is-small is-secondary" href="/preparation?show={show.id}">
							<span class="icon is-size-8">
								<PicolEdit />
							</span><span>Förbered</span></a
						>
						<button class="button is-small is-secondary is-disabled" disabled on:click={handleViewStage}>
							<span class="icon is-size-8">
								<PicolControlsPlay />
							</span><span>Lansera</span></button
						>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.tag {
		border-radius: 28px;
	}
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
