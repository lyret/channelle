<script lang="ts">
	import { blur } from "svelte/transition";

	import Wrapper from "./_Wrapper.svelte";
	import ConfigurationInstruments from "~/components/instruments/ConfigurationInstruments.svelte";
	import TheaterHeader from "../theater/TheaterHeader.svelte";
	import IconArrowLeft from "~/components/picol/icons/Picol-arrow-full-left.svelte";
</script>

<Wrapper lockedToManager={true} hasInteractedWithTheDocument={true} disableCurtains={true}>
	<main in:blur={{ delay: 500, duration: 1000 }}>
		<TheaterHeader minimal={true} />
		<div class="action-bar">
			<a class="button is-small is-inverted" href="/">
				<span class="icon is-size-4">
					<IconArrowLeft />
				</span>
				<span class="is-family-secondary">Till scenen</span>
			</a>
		</div>
		<ConfigurationInstruments showParticipants={true} showMediaLibrary={false} />
	</main>
</Wrapper>

<style lang="scss">
	main {
		background-color: var(--channelle-main-bg-color);
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.action-bar {
		z-index: 2;
		border-radius: 8px;
		padding: 1.5rem;
		margin: 0 auto;
		max-width: 1200px;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: center;
		height: 48px;
		background-color: var(--channelle-menu-bg-color);
		overflow: hidden;

		.spacer {
			flex-grow: 0.2;
		}

		.button {
			border-radius: 0;
			border: none;
			padding: 12px;
			background-color: var(--channelle-menu-bg-color);
			color: var(--channelle-menu-text-color);

			&:hover {
				background-color: rgba(255, 255, 255, 0.1);
				transform: translateY(-1px);
			}

			&.active {
				font-weight: 900;
				background-color: var(--channelle-menu-text-color);
				color: var(--channelle-menu-bg-color);
			}
		}
	}

	// Responsive adjustments
	@include mobile {
		.action-bar {
			flex-wrap: wrap;
			height: auto;
			padding: 8px 0;

			.button {
				padding: 8px;
				margin: 2px;
			}
		}
	}
</style>
