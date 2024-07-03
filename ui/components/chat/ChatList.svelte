<script lang="ts">
	import { remove } from '~/api';
	import { createDatabaseStore } from '~/stores';
	import { currentParticipant } from '~/stores/connection';

	import ChatInput from './ChatInput.svelte';

	let backstageOnly: boolean = false;
	let allMessages = createDatabaseStore('message');
	let participants = createDatabaseStore('participant');

	$: backstageAllowed =
		$currentParticipant.actor || $currentParticipant.manager;
	$: allowedMessages = $allMessages
		.filter((m) => !m.backstage || backstageAllowed)
		.filter((m) => !backstageOnly || m.backstage);

	function participantName(id: number): string {
		const participant = $participants.find((p) => p.id == id);
		return participant?.name || '';
	}
	function removeMessage(id: number) {
		remove('message', { where: { id } });
	}
</script>

<div class="chat-container">
	{#if backstageAllowed}
		<div class="tab-container">
			<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-missing-attribute -->
			<div class="tabs is-fullwidth">
				<ul>
					<li
						class:is-active={!backstageOnly}
						on:click={() => (backstageOnly = false)}
					>
						<a>
							<span class="icon is-small"
								><ion-icon name="people"></ion-icon></span
							>
							<span>Alla</span>
						</a>
					</li>
					<li
						class:is-active={backstageOnly}
						on:click={() => (backstageOnly = true)}
					>
						<a class:has-text-info={backstageOnly}>
							<span class="icon is-small"
								><ion-icon name="people-circle"></ion-icon></span
							>
							<span>Backstage</span>
						</a>
					</li>
				</ul>
			</div>
		</div>
	{/if}

	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="list-container">
		<div class="list mb-4">
			{#each allowedMessages as message}
				<div
					class="list-item"
					class:has-background-info-light={message.backstage}
					class:has-text-right={message.participantId == $currentParticipant.id}
				>
					<div class="list-item-content">
						<div
							class="list-item-description"
							class:has-text-info={message.backstage}
						>
							{participantName(message.participantId)} ( {new Date(
								message.createdAt
							).getHours()}:{new Date(message.createdAt).getMinutes()}
							)
						</div>
						<div class="list-item-title">{message.message}</div>
					</div>
					{#if $currentParticipant.manager}
						<div class="list-item-controls">
							<div class="buttons is-right">
								<button class="button is-small is-outlined is-danger">
									<span class="icon" on:click={() => removeMessage(message.id)}>
										<ion-icon name="trash-bin"></ion-icon>
									</span>
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
	<div class="input-container">
		<ChatInput makeBackstage={backstageOnly} />
	</div>
</div>

<style>
	.chat-container {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		justify-content: normal;
		align-items: normal;
		align-content: normal;
		height: 100%;
		max-height: 800px;
	}
	.tab-container {
		display: block;
		flex-grow: 0;
		flex-shrink: 1;
		flex-basis: auto;
		align-self: auto;
		order: 0;
	}
	.list-container {
		display: block;
		flex-grow: 1;
		flex-shrink: 1;
		overflow: scroll;
		flex-basis: auto;
		align-self: auto;
		order: 0;
	}
	.input-container {
		display: block;
		flex-grow: 0;
		flex-shrink: 1;
		flex-basis: auto;
		align-self: auto;
		order: 0;
	}
</style>
