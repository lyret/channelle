<script lang="ts">
	import type { DataTypes } from '~/lib';
	import { update } from '~/lib';
	import { clickOutside } from '~/directives';
	import { userCameraBans, userMicrophoneBans } from '~/stores/users';

	export let participant: DataTypes['participant'];
	export let online: boolean = false;
	let loading: boolean = false;
	let active: boolean = false;

	async function doUpdate(
		participant: DataTypes['participant'],
		data: Partial<DataTypes['participant']>,
		ask?: string
	) {
		loading = true;
		if (!ask || confirm(ask)) {
			await update('participant', {
				where: { id: participant.id },
				data: data,
			});
		}
		loading = false;
	}
</script>

<div
	class="list-item"
	use:clickOutside
	on:click_outside={() => (active = false)}
>
	<div class="accordion-header" class:is-loading={loading}>
		<div
			class="icon"
			class:has-text-grey-light={!online}
			class:has-text-success={online}
		>
			{#if participant.manager}
				<ion-icon name="build"></ion-icon>
			{:else if participant.actor}
				<ion-icon name="accessibility"></ion-icon>
			{:else}
				<ion-icon name="ellipse"></ion-icon>
			{/if}
		</div>
		<div class="name pr-7" class:is-strikethrough={participant.blocked}>
			{participant.name}
		</div>
		<div class="buttons">
			{#if participant.manager || participant.actor}
				<button
					class="button is-small"
					class:has-text-danger={$userCameraBans[participant.id]}
					on:click={() =>
						userCameraBans.set(
							participant.id,
							!$userCameraBans[participant.id]
						)}
				>
					<span class="icon">
						<ion-icon
							name={$userCameraBans[participant.id]
								? 'videocam-off'
								: 'videocam'}
						></ion-icon>
					</span>
				</button>
			{/if}
			<button
				class="button is-small"
				class:has-text-danger={$userMicrophoneBans[participant.id]}
				on:click={() =>
					userMicrophoneBans.set(
						participant.id,
						!$userMicrophoneBans[participant.id]
					)}
			>
				<span class="icon">
					<ion-icon
						name={$userMicrophoneBans[participant.id] ? 'mic-off' : 'mic'}
					></ion-icon>
				</span>
			</button>
			<button class="button is-small" on:click={() => (active = !active)}>
				<span class="icon">
					{#if active}
						<ion-icon name="close"></ion-icon>
					{:else}
						<ion-icon name="options"></ion-icon>
					{/if}
				</span>
			</button>
		</div>
	</div>
	{#if active}
		<div class="accordion-content">
			<!-- MAKE ACTOR -->
			{#if participant.actor && !participant.manager}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
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
			{:else if !participant.manager}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a
					class="dropdown-item"
					on:click={() =>
						doUpdate(
							participant,
							{ actor: true },
							`Är "${participant.name}" en skådespelare?`
						)}
				>
					<span class="icon"><ion-icon name="accessibility"></ion-icon></span>
					Skådespelare
				</a>
			{/if}
			<!-- MAKE TECHNICAN -->
			{#if participant.manager}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
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
				<!-- svelte-ignore a11y-no-static-element-interactions -->
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
			<!-- CHANGE NAME -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-missing-attribute -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<a
				class="dropdown-item"
				on:click={() =>
					doUpdate(participant, {
						name:
							prompt('Skriv nytt namn', participant.name) || participant.name,
					})}
			>
				<span class="icon"><ion-icon name="text"></ion-icon></span> Byt namn
			</a>
			<!-- BLOCK -->
			{#if participant.blocked}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
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
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a
					class="dropdown-item"
					on:click={() =>
						doUpdate(
							participant,
							{ blocked: true },
							`Vill du blockera och ta bort "${participant.name}"?`
						)}
				>
					<span class="icon"><ion-icon name="lock-closed"></ion-icon></span>
					Blockera person
				</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.list-item {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-items: start;
		justify-content: start;
		align-items: start;
		align-content: start;
	}
	.accordion-header {
		width: 100%;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-items: start;
		justify-content: start;
		align-items: start;
		align-content: start;
	}
	.accordion-header div {
		display: block;
		flex-grow: 0;
		flex-shrink: 1;
		flex-basis: auto;
		align-self: auto;
		order: 0;
	}
	.accordion-header .name {
		flex-grow: 1;
	}

	.accordion-content {
		flex-basis: 1;
		width: 100%;
	}

	.accordion-content a:hover {
		color: white;
	}
</style>
