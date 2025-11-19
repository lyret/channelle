<script lang="ts">
	import { onMount } from "svelte";
	import { persisted } from "svelte-persisted-store";
	import { stageChatEnabledStore, peerStore } from "~/api/media";
	import { showStageChatStore } from "~/stores/stage";
	import ChatInput from "../../chat/ChatInput.svelte";
	import ChatList from "../../chat/ChatList.svelte";
	import IconStar from "../../icons/Icon-star.svelte";
	import IconUsers from "../../icons/Icon-users.svelte";

	const backstageOnly = persisted(`${CONFIG.runtime.slug}-panel-chat-backstage-only`, false);

	onMount(() => {
		const stop = stageChatEnabledStore.subscribe((enabled) => {
			if (!enabled) {
				showStageChatStore.set(false);
			}
		});

		return () => stop();
	});
</script>

<div class="instrument">
	<ChatList backstageOnly={$backstageOnly} />

	{#if $peerStore.actor || $peerStore.manager}
		<div class="tab-container">
			<div class="tabs is-fullwidth">
				<ul>
					<li class:is-active={!$backstageOnly}>
						<a on:click={() => ($backstageOnly = false)}>
							<span class="icon is-small"><IconUsers /></span>
							<span>Alla</span>
						</a>
					</li>
					<li class:is-active={$backstageOnly}>
						<a class:has-text-link={$backstageOnly} on:click={() => ($backstageOnly = true)}>
							<span class="icon is-small"><IconStar /></span>
							<span>Backstage</span>
						</a>
					</li>
				</ul>
			</div>
		</div>
	{/if}

	<div class="chat-input">
		<ChatInput makeBackstage={$backstageOnly} />
	</div>
</div>

<style>
	.instrument {
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
		order: 1;
	}
	.chat-input {
		display: block;
		flex-grow: 0;
		flex-shrink: 1;
		flex-basis: auto;
		align-self: auto;
		order: 2;
	}
</style>
