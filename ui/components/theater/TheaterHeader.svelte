<script lang="ts">
	import { blur } from "svelte/transition";
	import rosesGif from "~/assets/images/roses.gif";
	import logoGif from "~/assets/images/logo-free.gif";
	import stageLightsGif from "~/assets/gifs/stagelights_turning_orange_md_clr.gif";
</script>

<section class="has-text-centered"  in:blur={{ delay: 500, duration: 1000 }} >
	<div class="hero-body has-text-centered">
		<div class="container" in:blur={{ delay: 500, duration: 1000 }} 	>
			<div class="decorations">
				<img src={stageLightsGif} alt="Stage lights" class="stage-lights" />
				<img src={stageLightsGif} alt="Stage lights" class="stage-lights" />
				<img src={stageLightsGif} alt="Stage lights" class="stage-lights" />
				<img src={stageLightsGif} alt="Stage lights" class="stage-lights" />
				<img src={stageLightsGif} alt="Stage lights" class="stage-lights" />
			</div>
		</div>
		<img src={logoGif} alt="Channelle" class="logo"/>
		<h2 class="subtitle theater-title">Välkommen till din kvartersteater</h2>
	</div>
</section>

<style lang="scss">
	.logo {
		margin-top: 1rem;
		max-width: 400px;
		max-height: 100px;
	}
	.decorations {
		margin-top: -1rem;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 6rem;

		.stage-lights {
			width: 150px;
			height: auto;
			filter: drop-shadow(0 2px 8px rgba(255, 165, 0, 0.6));
		}
	}

	// Responsive adjustments
	@include mobile {
		.theater-decorations {
			gap: 1.5rem;

			.stage-lights {
				width: 100px;
			}
		}
	}
</style>
