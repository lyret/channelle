<script lang="ts">
	import IconSlash from "../icons/Icon-slash.svelte";

	export let message: string = "Du är portad";
</script>

<h1 class="title">
	<span class="icon is-large is-warning"><IconSlash /></span>
</h1>
<h1 class="title">{message}</h1>
