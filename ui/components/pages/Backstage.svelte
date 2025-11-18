<script lang="ts">
	import { blur } from "svelte/transition";

	import Wrapper from "./_Wrapper.svelte";
	import ConfigurationInstruments from "~/components/instruments/ConfigurationInstruments.svelte";

	import logoSrc from "~/assets/images/redrose.gif";
</script>

<Wrapper lockedToManager={true}>
	<main in:blur={{ delay: 500, duration: 1000 }}>
		<!-- Header -->
		<div class="image-container has-text-centered header" style="height:100px" in:blur={{ duration: 5000, delay: 2000 }}>
			<img src={logoSrc} alt="logotyp" class="mt-3 mb-0" style="height:80px" />
		</div>
		<ConfigurationInstruments showParticipants={true} showMediaLibrary={false} />
	</main>
</Wrapper>

<style>
	main {
		background-color: var(--channelle-main-bg-color);
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.header {
		background-color: var(--channelle-main-bg-color);
		padding: 0;
		display: block;
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 1;
	}
</style>
