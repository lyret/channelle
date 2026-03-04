<script lang="ts">
	import type { HistoryAttributes } from "~/types/serverSideTypes";

	export let history: HistoryAttributes;
</script>

<div class="notification history-entry">
	<div class="level is-mobile">
		<div class="level-left">
			<div class="level-item">
				<div>
					<p class="title is-6 is-family-title">
						{history.showName}
					</p>
					<p class="subtitle is-7 is-family-secondary mt-2">
						{history.showDescription}
					</p>
					<p class="subtitle is-7 is-family-secondary mt-1">
						<small>
							<strong>Datum:</strong>
							{new Date(history.startedAt).toLocaleDateString()}<br />
							<strong>Varaktighet:</strong>
							{history.duration} minuter<br />
							<strong>Deltagare:</strong>
							{history.nrOfActors} skådespelare, {history.nrOfVisitors} åskådare
						</small>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.notification.history-entry {
		border-radius: 8px;
		max-width: 100%;
		overflow: hidden;
		background-color: var(--bulma-scheme-main);
		color: var(--bulma-scheme-invert);
		border: 1px solid var(--bulma-scheme-main-bis);
		margin-bottom: 1rem;
	}

	.title {
		color: black !important;
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

	.level-left {
		align-items: flex-start;
		flex: 1;
		margin-right: 1rem;
	}

	.level-item {
		justify-content: flex-start;
		min-width: 0;
		flex-grow: 0;
		flex-shrink: 1;
	}

	@media screen and (max-width: 768px) {
		.title {
			font-size: 1.1rem !important;
		}

		.subtitle {
			font-size: 0.8rem !important;
		}
	}
</style>
