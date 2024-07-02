<script lang="ts">
	import type { DataTypes } from '~/api';
	import { update } from '~/api';
	import { clickOutside } from '~/directives';

	export let participant: DataTypes['participant'];
	let loading: boolean = false;
	let dropdownActive: boolean = false;

	async function doUpdate(
		participant: DataTypes['participant'],
		data: Partial<DataTypes['participant']>,
		ask?: string
	) {
		loading = true;
		if (!ask || confirm(ask)) {
			await update('participant', { where: { id: participant.id }, data });
		}
		loading = false;
	}
</script>

<div
	class="dropdown mt-3"
	class:is-active={dropdownActive}
	style="width: 100%;"
	use:clickOutside
	on:click_outside={() => (dropdownActive = false)}
>
	<div class="dropdown-trigger">
		<button
			class="button"
			aria-haspopup="true"
			aria-controls="dropdown-menu"
			on:click={() => (dropdownActive = true)}
			class:is-loading={loading}
		>
			<span
				class="icon"
				class:has-text-grey-light={!participant.online}
				class:has-text-success={participant.online}
			>
				{#if participant.manager}
					<ion-icon name="build"></ion-icon>
				{/if}
				{#if participant.actor}
					<ion-icon name="accessibility"></ion-icon>
				{/if}
				{#if !participant.manager && !participant.actor}
					<ion-icon name="ellipse"></ion-icon>
				{/if}
			</span>
			<span class="pr-7" class:is-strikethrough={participant.blocked}
				>{participant.name}</span
			>
		</button>
	</div>
	<div class="dropdown-menu">
		<div class="dropdown-content">
			<!-- ACTOR -->
			{#if participant.actor}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<a
					class="dropdown-item"
					on:click={() =>
						doUpdate(
							participant,
							{ actor: false },
							`Ta bort "${participant.name}" som skådespelare?`
						)}
				>
					<span class="icon"><ion-icon name="close"></ion-icon></span> Inte skådespare
				</a>
			{:else}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<a
					class="dropdown-item"
					on:click={() =>
						doUpdate(
							participant,
							{ actor: true },
							`Är "${participant.name}" en skådespelare?`
						)}
				>
					<span class="icon"><ion-icon name="accessibility"></ion-icon></span> Skådespelare
				</a>
			{/if}
			<!-- TECHNICAN -->
			{#if participant.manager}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<a
					class="dropdown-item"
					on:click={() =>
						doUpdate(
							participant,
							{ manager: false },
							`Ta bort "${participant.name}" som tekniker?`
						)}
				>
					<span class="icon"><ion-icon name="close"></ion-icon></span> Inte tekniker
				</a>
			{:else}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<a
					class="dropdown-item"
					on:click={() =>
						doUpdate(
							participant,
							{ manager: true },
							`Är "${participant.name}" en tekniker?`
						)}
				>
					<span class="icon"><ion-icon name="build"></ion-icon></span> Tekniker
				</a>
			{/if}
			<!-- BLOCKED -->
			{#if participant.blocked}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<a
					class="dropdown-item"
					on:click={() => doUpdate(participant, { blocked: false })}
				>
					<span class="icon"><ion-icon name="lock-open"></ion-icon></span> Tillåt
					tillbaka
				</a>
			{:else}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<a
					class="dropdown-item"
					on:click={() =>
						doUpdate(
							participant,
							{ blocked: true },
							`Vill du blockera och ta bort "${participant.name}"?`
						)}
				>
					<span class="icon"><ion-icon name="lock-closed"></ion-icon></span> Blockera
					person
				</a>
			{/if}
		</div>
	</div>
</div>
