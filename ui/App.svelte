<script lang="ts">
	import { connectionStatus, currentParticipant } from "./stores/connection";
	import { route } from "~/stores/url";

	import ManagePage from "./pages/Manage.svelte";
	import Loader from "./components/general/Loader.svelte";
</script>

{$currentParticipant}
{#if $connectionStatus == "connected"}
	{#if $route.group == "admin"}
		<ManagePage />
	{:else if $route.group == "order" }
		<ManagePage />
	{:else if $route.group == "pong" }
		<ManagePage />
	{:else }
		<ManagePage />
	{/if}
{:else}
	<Loader label={"Ansluter"} />
{/if}