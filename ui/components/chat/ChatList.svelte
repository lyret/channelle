<script lang="ts">
	import { onMount } from 'svelte';
	import { blur } from 'svelte/transition';
	import { createDatabaseStore } from '~/stores';
	import { currentParticipant } from '~/lib/stores/api';
	import { remove } from '~/lib';

	export let backstageOnly: boolean = false;

	let ref: HTMLDivElement;
	let loaded = false;
	let hasUnread = false;

	onMount(() => {
		if (ref) {
			ref.addEventListener('scroll', () => {
				console.log(
					ref.scrollTop > ref.scrollHeight - ref.clientHeight - 60,
					ref.scrollTop,
					ref.scrollHeight - ref.clientHeight - 60,
					ref.scrollHeight,
					ref.clientHeight
				);
				if (
					hasUnread &&
					ref.scrollTop >= ref.scrollHeight - ref.clientHeight - 60
				) {
					hasUnread = false;
				}
			});
		}
	});

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

	onMount(() => {
		const stop = allMessages.subscribe((data) => {
			console.log('new messages', data, $allMessages);

			if (loaded) {
				if (ref && ref.scrollTop > ref.scrollHeight - ref.clientHeight - 60) {
					setTimeout(() => {
						ref.scroll({ top: ref.scrollHeight });
					}, 0);
				} else {
					hasUnread = true;
				}
			} else if (!allMessages.isDefault()) {
				loaded = true;
				setTimeout(() => {
					if (ref) {
						ref.scroll({ top: ref.scrollHeight });
					}
				}, 0);
			}
		});

		return () => {
			stop();
		};
	});
</script>

<div class="list-container" bind:this={ref} class:has-unread={hasUnread}>
	<div class="list">
		{#if !allowedMessages.length}
			<div class="list-item">
				<div class="list-item-content">
					<div
						class="list-item-title is-family-title is-size-4 has-text-grey-light"
					>
						Här kommer chattmeddelanden att dyka upp..
					</div>
				</div>
			</div>
		{:else}
			{#each allowedMessages as message, index}
				{#key message.id}
					<div class="list-item">
						<div class="list-item-content" transition:blur>
							<div
								class:has-text-right={message.participantId ==
									$currentParticipant.id}
								class="list-item-description is-family-title is-size-6"
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
						{#if $currentParticipant.manager}
							<div class="list-item-controls">
								<div class="buttons is-right">
									<button class="button is-small is-dark is-danger">
										<span
											class="icon"
											on:click={() => removeMessage(message.id)}
										>
											<ion-icon name="trash-bin"></ion-icon>
										</span>
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/key}
			{/each}
		{/if}
	</div>
</div>
{#if hasUnread}
	<div in:blur>
		<p
			class="has-text-centered has-text-weight-bold is-family-title h has-text-success"
		>
			nya meddelanden!
		</p>
	</div>
{/if}

<style>
	.list-container {
		max-height: 100%;
		overflow: scroll;
		display: block;
		flex-grow: 0;
		overflow: scroll;
		flex-basis: auto;
		align-self: auto;
		order: 0;
		padding: 8px;
		transition: border 0.4s;
	}
	.list-container.has-unread {
		border-bottom-width: 4px;
		border-bottom-color: var(--bulma-success);
		border-bottom-style: groove;
	}
	.list-item-description {
		font-weight: 900;
		letter-spacing: 0.1em;
	}
</style>
