<script lang="ts">
	import { blur } from "svelte/transition";
	import ChatInput from "../../chat/ChatInput.svelte";
	import ChatList from "../../chat/ChatList.svelte";
	import { stageChatEnabledStore } from "~/api/room";
</script>

<div class="chat-window" in:blur={{ duration: 500 }}>
	<ChatList />
	{#if $stageChatEnabledStore}
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
