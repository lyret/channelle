<script lang="ts">
	import { blur } from "svelte/transition";
</script>

<main in:blur={{ delay: 500, duration: 1000 }}>
	<h1>Working</h1>
</main>
