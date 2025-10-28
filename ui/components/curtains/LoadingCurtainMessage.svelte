<script lang="ts">
	export let label: string = "";
</script>

<progress class="progress is-large" />
<h1 class="title is-family-default">
	{label}
</h1>

<style lang="scss">
	h1 {
		font-size: 2.5vw;
		@include mobile {
			font-size: 5vw;
		}
	}
	.progress {
		--bulma-progress-value-background-color: var(--channelle-menu-text-color);
		--bulma-progress-bar-background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-main-text-color);
	}
</style>
