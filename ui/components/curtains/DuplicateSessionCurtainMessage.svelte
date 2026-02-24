<script lang="ts">
	import { currentPeerStore } from "~/api/auth";

	function reconnect() {
		window.location.reload();
	}
</script>

<h1 class="title is-3">{$currentPeerStore.name}, du anslöt från ett annat fönster eller enhet</h1>
<p class="subtitle mt-3">Den här anslutningen är nu inaktiv</p>

<div class="buttons is-centered mt-5">
	<button class="button is-primary" on:click={reconnect}> Återanslut </button>
</div>
