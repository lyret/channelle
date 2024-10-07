<script lang="ts">
	import { onMount } from 'svelte';
	import { blur } from 'svelte/transition';
	import ChatInput from '../chat/ChatInput.svelte';
	import ChatList from '../chat/ChatList.svelte';
	import { sceneVisitorAudioIsEnabled } from '~/stores/scene/sceneVisitorAudioIsEnabled';

	let ref: HTMLDivElement;
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
</script>

<div class="chat-window" in:blur={{ duration: 500 }}>
	<ChatList />
	{#if $sceneVisitorAudioIsEnabled}
		<ChatInput />
	{/if}
</div>

<style>
	.chat-window {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 32px 16px 32px 16px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
</style>
