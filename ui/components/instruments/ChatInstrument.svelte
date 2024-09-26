<script lang="ts">
	import { createLocalStore } from '~/stores';

	import ChatInput from '../chat/ChatInput.svelte';
	import ChatList from '../chat/ChatList.svelte';

	let backstageOnly = createLocalStore(
		'instruments-chat-backstage-only',
		false
	);
</script>

<div class="chat-instrument">
	<h1 class="title">Chattmeddelanden</h1>
	<div class="tab-container">
		<div class="tabs is-fullwidth">
			<ul>
				<li class:is-active={!$backstageOnly}>
					<a on:click={() => ($backstageOnly = false)}>
						<span class="icon is-small"
							><ion-icon name="people"></ion-icon></span
						>
						<span>Alla</span>
					</a>
				</li>
				<li class:is-active={$backstageOnly}>
					<a
						class:has-text-info={$backstageOnly}
						on:click={() => ($backstageOnly = true)}
					>
						<span class="icon is-small"
							><ion-icon name="people-circle"></ion-icon></span
						>
						<span>Backstage</span>
					</a>
				</li>
			</ul>
		</div>
	</div>

	<ChatList backstageOnly={$backstageOnly} />

	<div class="chat-input">
		<ChatInput makeBackstage={$backstageOnly} />
	</div>
</div>

<style>
	.chat-instrument {
		width: 100%;
		height: 100%;
		max-height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		flex-wrap: nowrap;
		justify-content: normal;
		align-items: normal;
		align-content: normal;
	}
	.tab-container {
		display: block;
		flex-grow: 0;
		flex-shrink: 1;
		flex-basis: auto;
		align-self: auto;
		order: 0;
	}
</style>
