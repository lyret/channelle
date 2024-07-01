<script lang="ts">
	import { connectionStatus, currentParticipant } from '~/stores/connection';
	import { route } from '~/stores/ui/url';

	import ManagePage from '~/pages/Manage.svelte';
	import Loader from '~/components/app/Loader.svelte';
	import Authenticate from '~/components/app/Authenticate.svelte';
	import Blocked from '~/components/app/Blocked.svelte';
</script>

{#if $connectionStatus == 'blocked'}
	<Blocked />
{:else if $connectionStatus == 'connected' && $currentParticipant}
	{#if !$currentParticipant.name}
		<Authenticate participant={$currentParticipant} />
	{:else if $route.group == 'foyer'}
		<ManagePage />
	{:else if $route.group == 'salon'}
		<ManagePage />
	{:else if $route.group == 'backstage'}
		<ManagePage />
	{/if}
{:else}
	<Loader label={'Ansluter'} />
{/if}
