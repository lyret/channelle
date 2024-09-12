<script lang="ts">
	import {
		currentParticipationStatus,
		currentParticipant,
	} from '~/stores/connection';
	import { route } from '~/stores/ui/url';

	import ManagePage from '~/pages/Manage.svelte';
	import StagePage from '~/pages/StagePage.svelte';
	import Loader from '~/components/app/Loader.svelte';
	import Authenticate from '~/components/app/Authenticate.svelte';
	import Blocked from '~/components/app/Blocked.svelte';
</script>

{#if $currentParticipationStatus == 'blocked'}
	<Blocked />
{:else if $currentParticipationStatus == 'online' && $currentParticipant}
	{#if !$currentParticipant.name}
		<Authenticate participant={$currentParticipant} />
	{:else if $route.group == 'foyer'}
		<StagePage />
	{:else if $route.group == 'salon'}
		<ManagePage />
	{:else if $route.group == 'backstage'}
		<ManagePage />
	{/if}
{:else}
	<Loader label={'Ansluter'} />
{/if}
