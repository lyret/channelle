<script lang="ts">
	import IconSlash from "../icons/Icon-slash.svelte";

	export let message: string = "Du är portad";
</script>

<h1 class="title is-family-default">
	<span class="icon is-large is-warning"><IconSlash /></span>
</h1>
<h1 class="title is-family-default">{message}</h1>

<style lang="scss">
	h1 {
		font-size: 2.5vw;
		@include mobile {
			font-size: 5vw;
		}
	}
	.icon {
		transform: scale(2);
	}
</style>
