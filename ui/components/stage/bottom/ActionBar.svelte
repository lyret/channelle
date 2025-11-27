<script lang="ts">
	import { blur } from "svelte/transition";
	import CameraControls from "./_CameraControls.svelte";
	import MicrophoneControls from "./_MicrophoneControls.svelte";
	import { isLoadingStore, sessionsStore, peerStreamsStore } from "~/api/stageNew";
	import { showStageChatStore, showStageSettingsStore } from "~/stores/stage";
	import IconSettings from "~/components/icons/Icon-settings.svelte";
	import IconMessage from "~/components/icons/Icon-message-circle.svelte";
	import IconUsers from "~/components/icons/Icon-users.svelte";

	// Get reactive values

	$: sessions = $sessionsStore;
	$: streams = $peerStreamsStore;
	$: isLoading = $isLoadingStore;

	// Count connected peers
	$: connectedPeers = Object.keys(sessions).length;
	$: activeStreams = Object.keys(streams).length;

	function toggleChat() {
		$showStageChatStore = !$showStageChatStore;
		if ($showStageChatStore) {
			$showStageSettingsStore = false;
		}
	}

	function toggleSettings() {
		$showStageSettingsStore = !$showStageSettingsStore;
		if ($showStageSettingsStore) {
			$showStageChatStore = false;
		}
	}
</script>

<div class="action-bar" transition:blur>
	<div class="level is-mobile">
		<!-- Left side - Media controls -->
		<div class="level-left">
			<div class="level-item">
				<CameraControls minimal={false} />
			</div>
			<div class="level-item">
				<MicrophoneControls minimal={false} />
			</div>
		</div>

		<!-- Center - Status info -->
		<div class="level-item has-text-centered is-hidden-mobile">
			<div class="status-info">
				<span class="icon-text">
					<span class="icon">
						<IconUsers />
					</span>
					<span>{connectedPeers} peers</span>
				</span>
				{#if activeStreams > 0}
					<span class="tag is-success is-light ml-2">{activeStreams} active</span>
				{/if}
				{#if isLoading}
					<span class="tag is-warning is-light ml-2">Loading...</span>
				{/if}
			</div>
		</div>

		<!-- Right side - UI controls -->
		<div class="level-right">
			<div class="level-item">
				<button type="button" class="button is-small" class:is-active={$showStageChatStore} on:click={toggleChat} title="Toggle chat">
					<span class="icon is-size-4">
						<IconMessage />
					</span>
					<span class="is-hidden-mobile">Chat</span>
				</button>
			</div>
			<div class="level-item">
				<button type="button" class="button is-small" class:is-active={$showStageSettingsStore} on:click={toggleSettings} title="Toggle settings">
					<span class="icon is-size-4">
						<IconSettings />
					</span>
					<span class="is-hidden-mobile">Settings</span>
				</button>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.action-bar {
		width: 100%;
		padding: 0 1rem;
		background-color: var(--channelle-menu-bg-color);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.level {
		margin: 0;
		min-height: 52px;
	}

	.button {
		border-radius: 0;
		border: none;
		padding: 12px;
		background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-menu-text-color);
		transition: background-color 0.2s;

		&:hover {
			background-color: rgba(255, 255, 255, 0.1);
		}

		&.is-active {
			background-color: rgba(255, 255, 255, 0.15);
			color: var(--channelle-primary-color, #00d1b2);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&.is-danger {
			&:hover {
				background-color: rgba(241, 70, 104, 0.2);
				color: #f14668;
			}
		}
	}

	.status-info {
		display: flex;
		align-items: center;
		color: var(--channelle-menu-text-color);
		font-size: 0.9rem;

		.icon-text {
			display: flex;
			align-items: center;
			gap: 0.25rem;
		}

		.tag {
			font-size: 0.75rem;
		}
	}

	@include mobile {
		.action-bar {
			padding: 0.5rem;
		}

		.level {
			flex-wrap: wrap;
		}

		.level-left,
		.level-right {
			flex-basis: 100%;
		}

		.button {
			padding: 8px;
		}
	}
</style>
