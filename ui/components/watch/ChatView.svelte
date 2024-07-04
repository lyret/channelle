<script lang="ts">
	import { remove } from '~/api';
	import { createDatabaseStore } from '~/stores';
	import { currentParticipant } from '~/stores/connection';

	let allMessages = createDatabaseStore('message');
	let participants = createDatabaseStore('participant');

	$: backstageAllowed =
		$currentParticipant.actor || $currentParticipant.manager;
	$: allowedMessages = $allMessages.filter(
		(m) => !m.backstage || backstageAllowed
	);

	function participantName(id: number): string {
		const participant = $participants.find((p) => p.id == id);
		return participant?.name || '';
	}
</script>

<div class="chat-container">
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
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.chat-container {
		background: white;
		border-radius: 20px;
		overflow: hidden;
		display: flex;
		width: 80%;
		flex-direction: column;
		flex-wrap: nowrap;
		justify-content: normal;
		align-items: normal;
		align-content: normal;
		height: 100%;
		max-height: 800px;
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
</style>
