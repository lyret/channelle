<script lang="ts">
	import { onMount } from 'svelte';
	import { blur, type BlurParams } from 'svelte/transition';
	import { scrollStore } from '~/legos/stores/scrollStore';
	import { createDatabaseStore } from '~/stores';
	import { currentParticipant } from '~/stores/connection';

	let ref: HTMLDivElement;
	let loaded = false;
	let hasUnread = false;

	onMount(() => {
		if (ref) {
			ref.addEventListener('scroll', () => {
				if (hasUnread && ref.scrollTop >= ref.scrollHeight - ref.offsetHeight) {
					hasUnread = false;
				}
			});
		}
	});

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

	function getBlurAnimationOptions(
		message: (typeof allowedMessages)[0],
		index: number
	): BlurParams {
		// Make all messages blur the same after the inital load
		// and make sure that new messages are scrooled into view
		// if already at the bottom
		if (loaded) {
			if (ref && ref.scrollHeight - ref.scrollTop < ref.scrollHeight / 4) {
				ref.scroll({ top: ref.scrollHeight });
			} else {
				hasUnread = true;
			}
			return { delay: 0, duration: 700 };
		}
		if (index == allowedMessages.length - 1) {
			loaded = true;
			if (ref) {
				ref.scroll({ top: ref.scrollHeight });
			}
		}

		// Initial animation
		return { delay: 0, duration: Math.min(2000, index * 100) };
	}
</script>

<div class="list-container">
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="notification"
		in:blur={{ duration: 500 }}
		bind:this={ref}
		class:has-unread={hasUnread}
	>
		<div class="list">
			{#if !allowedMessages.length}
				<div class="list-item">
					<div class="list-item-content">
						<div
							class="list-item-title is-family-chentalle is-size-4 has-text-grey-light"
						>
							Här kommer chattmeddelanden att dyka upp..
						</div>
					</div>
				</div>
			{/if}
			{#each allowedMessages as message, index}
				<div
					class="list-item"
					in:blur={getBlurAnimationOptions(message, index)}
				>
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
	.list-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 64px 16px 64px 16px;
	}
	.notification {
		max-height: 100%;
		overflow: scroll;
		display: block;
		flex-grow: 1;
		flex-shrink: 1;
		overflow: scroll;
		flex-basis: auto;
		align-self: auto;
		order: 0;
		padding: 8px;

		transition: border 0.4s;
	}
	.notification.has-unread {
		border-bottom-width: 4px;
		border-bottom-color: var(--bulma-success);
		border-bottom-style: groove;
	}
	.list-item-description {
		font-weight: 900;
		letter-spacing: 0.1em;
	}
</style>
