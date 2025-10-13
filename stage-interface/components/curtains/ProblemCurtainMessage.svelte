<script>
	import IconCpu from "../icons/Icon-cpu.svelte";
</script>

<h1 class="title">
	<span class="icon"><IconCpu /></span>
</h1>
<h1 class="title is-family-default">Ett okänt fel har inträffat</h1>
<p class="label">Prova att ladda om sidan eller byt webbläsare</p>

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
