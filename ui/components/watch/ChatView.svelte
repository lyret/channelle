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
	<div class="notification mt-6 mb-6">
		<div class="list">
			{#each allowedMessages as message}
				<div class="list-item">
					<div class="list-item-content">
						<div
							class:has-text-right={message.participantId ==
								$currentParticipant.id}
							class="list-item-description is-family-chentalle is-size-6"
							class:has-text-info-light={message.backstage}
							class:has-text-grey-light={!message.backstage}
						>
							{participantName(message.participantId)} ( {new Date(
								message.createdAt
							).getHours()}:{new Date(message.createdAt).getMinutes()}
							{message.backstage ? 'backstage' : ''}
							)
						</div>
						<div
							class:is-underlined={message.participantId ==
								$currentParticipant.id}
							class="list-item-title"
							class:has-text-info={message.backstage}
						>
							{message.message}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.chat-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: scroll;
		padding: 16px;
	}
	.notification {
		display: block;
		flex-grow: 1;
		flex-shrink: 1;
		overflow: scroll;
		flex-basis: auto;
		align-self: auto;
		order: 0;
		padding: 8px;
	}
	.list-item-rounded {
		border-radius: 12px;
	}
	.list-item-description {
		font-weight: 900;
		letter-spacing: 0.1em;
	}
</style>
