<script lang="ts">
	import { isTheaterAuthenticated } from "~/api/auth";
	import { themes, DEFAULT_THEME } from "~/api/theme";
	import PicolEdit from "./picol/icons/Picol-edit.svelte";
	import type { ShowAttributes } from "~/types/serverSideTypes";
	import { fetchShows, updateShow } from "~/api/shows";

	export let show: ShowAttributes;

	// Get theme for this show
	$: showTheme = themes[show.theme as keyof typeof themes] || themes[DEFAULT_THEME];

	async function togglePublicStatus() {
		try {
			await updateShow({
				id: show.id,
				isPublic: !show.isPublic,
			});
			fetchShows();
		} catch (error) {
			console.error("Failed to toggle public status:", error);
		}
	}
</script>

<div
	class="notification"
	style="--show-theme-bg: {showTheme.menuBgColor}; --show-theme-text: {showTheme.menuTextColor}; --show-theme-primary: {showTheme.primaryColor};"
>
	<div class="level is-mobile">
		<div class="level-left">
			<div class="level-item">
				<div>
					<p class="title is-6 is-family-title">
						{show.name}
						{show.theme}
					</p>
					{#if show.description}
						<p class="subtitle is-7 is-family-secondary mt-2">{show.description}</p>
					{/if}
				</div>
			</div>
		</div>
		<div class="level-right">
			<div class="level-item">
				<div class="buttons">
					{#if $isTheaterAuthenticated}
						<a href={`/preparation?show=${show.id}`} class="button is-small is-secondary">
							<span class="icon is-small">
								<PicolEdit />
							</span><span>Redigera</span>
						</a>
						<button
							class="button is-small"
							class:is-info={show.isPublic}
							class:is-warning={!show.isPublic}
							on:click={togglePublicStatus}
							title={show.isPublic ? "Gör privat" : "Gör publik"}
						>
							<span>{show.isPublic ? "Publik" : "Privat"}</span>
						</button>
					{/if}
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
		max-width: 100%;
		overflow: hidden;
		background-color: var(--show-theme-bg, var(--channelle-menu-bg-color));
		color: var(--show-theme-text, var(--channelle-menu-text-color));
		border: 1px solid var(--show-theme-primary, var(--bulma-primary));
	}

	.title {
		word-wrap: break-word;
		overflow-wrap: break-word;
		min-width: 0;
	}

	.subtitle {
		word-wrap: break-word;
		overflow-wrap: break-word;
		min-width: 0;
	}

	.level {
		align-items: flex-start;
		margin-bottom: 0;
	}

	.level-left,
	.level-right {
		min-width: 0;
	}

	.level-left {
		align-items: flex-start;
		flex: 1;
		margin-right: 1rem;
	}

	.level-right {
		flex-shrink: 0;
		margin-left: 0;
	}

	.level-item {
		justify-content: flex-start;
		min-width: 0;
		flex-grow: 0;
		flex-shrink: 1;
	}

	.buttons {
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	@media screen and (max-width: 1024px) {
		.level {
			flex-direction: column;
			align-items: stretch;
		}

		.level-left {
			margin-right: 0;
			margin-bottom: 1rem;
		}

		.level-right {
			width: 100%;
		}

		.buttons {
			justify-content: flex-start;
			width: 100%;
		}
	}

	@media screen and (max-width: 768px) {
		.buttons {
			flex-direction: column;
			width: 100%;
		}

		.button {
			width: 100%;
			justify-content: center;
		}

		.title {
			font-size: 1.1rem !important;
		}

		.subtitle {
			font-size: 0.8rem !important;
		}
	}
</style>
