<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import IconMessageCircle from "../icons/Icon-message-circle.svelte";
	import IconUser from "../icons/Icon-user.svelte";
	import SceneLayoutPreview from "./_SceneLayoutPreview.svelte";
	import type { Peer, Scene } from "~/types/serverSideTypes";

	const dispatch = createEventDispatcher<{ update: Scene; select: Scene }>();

	export let selectedLayout: Scene | undefined;
	export let peers: Array<Peer>;
	export let layout: Scene;
	export let expanded: boolean = false;

	$: selected = selectedLayout?.name == layout.name;

	function onChange(e: any, cell: any) {
		e.stopPropagation();
		cell.peerId = (e.target as any).value;
		dispatch("update", layout);
		if (selected) {
			dispatch("select", layout);
		}
	}

	function toggleExpanded(e: Event) {
		e.stopPropagation();
		expanded = !expanded;
	}

	function activateScene(e: Event) {
		e.stopPropagation();
		dispatch("select", layout);
		expanded = false;
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="scene-control" class:is-expanded={expanded} class:is-selected={selected}>
	<!-- Header - always clickable -->
	<div class="scene-header" on:click={toggleExpanded}>
		<div class="scene-info">
			<div class="layout-preview-container">
				<SceneLayoutPreview {layout} size="small" />
			</div>
			<div class="scene-text-info">
				<h3 class="scene-title">{layout.name}</h3>
				<div class="scene-tags">
					{#if layout.chatEnabled}
						<span class="property-tag enabled">💬</span>
					{/if}
					{#if layout.visitorAudioEnabled}
						<span class="property-tag enabled">🎤</span>
					{/if}
					{#if layout.visitorVideoEnabled}
						<span class="property-tag enabled">📹</span>
					{/if}
					{#if layout.effectsEnabled}
						<span class="property-tag enabled">✨</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Expanded content -->
	{#if expanded}
		<div class="scene-details">
			<!-- Video Layout Grid - Most Important -->
			<div class="field">
				<label class="label">Videolayout</label>
				{#if layout.layout && layout.layout.length > 0}
					<div class="video-grid-container">
						<div class="video-grid has-{layout?.layout[0] && layout.layout[0].length}-cols">
							{#each layout.layout as row, rowIndex (rowIndex)}
								{#each row as cell, cellIndex (`${rowIndex}-${cellIndex}`)}
									<div class="video-cell" data-position="{rowIndex + 1}-{cellIndex + 1}">
										{#if cell.type == "empty"}
											<div class="cell-content empty-cell">
												<span class="cell-label">Tomhet</span>
											</div>
										{:else if cell.type == "chat"}
											<div class="cell-content chat-cell">
												<span class="cell-icon"><IconMessageCircle /></span>
												<span class="cell-label">Chat</span>
											</div>
										{:else if cell.type == "actor"}
											<div class="cell-content actor-cell">
												<select class="actor-select" on:change={(e) => onChange(e, cell)} on:click={(e) => e.stopPropagation()}>
													<option value={-1}>Välj en aktör</option>
													{#each peers as peer (peer.id)}
														<option value={peer.id} selected={cell.peerId == peer.id.toString()}>
															{peer.name}
														</option>
													{/each}
												</select>
											</div>
										{/if}
									</div>
								{/each}
							{/each}
						</div>
					</div>
				{:else}
					<p>Automatisk layout där alla aktiverade videokameror visas.</p>
				{/if}
			</div>

			<!-- Scene Properties -->
			<div class="field">
				<label class="label">Sceninställningar</label>
				<div class="property-summary">
					<div class="property-item">
						<span class="property-tag" class:enabled={layout.chatEnabled}>💬</span>
						<span class="property-desc">Chat {layout.chatEnabled ? "på" : "av"}</span>
					</div>
					<div class="property-item">
						<span class="property-tag" class:enabled={layout.visitorAudioEnabled}>🎤</span>
						<span class="property-desc">Publikljud {layout.visitorAudioEnabled ? "på" : "av"}</span>
					</div>
					<div class="property-item">
						<span class="property-tag" class:enabled={layout.visitorVideoEnabled}>📹</span>
						<span class="property-desc">Publikvideo {layout.visitorVideoEnabled ? "på" : "av"}</span>
					</div>
					<div class="property-item">
						<span class="property-tag" class:enabled={layout.effectsEnabled}>👏</span>
						<span class="property-desc">Effekter {layout.effectsEnabled ? "på" : "av"}</span>
					</div>
				</div>
			</div>

			<!-- Activation Controls -->
			<div class="field is-grouped">
				<div class="control is-expanded">
					<button class="button is-fullwidth" class:is-success={selected} on:click={activateScene} disabled={selected}>
						{selected ? "✓ Aktiv scen" : "Aktivera scen"}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.scene-control {
		margin-bottom: 0.75rem;
		border: 1px solid var(--bulma-border);
		border-radius: var(--bulma-radius);
		background: var(--bulma-scheme-main);
		overflow: hidden;
		transition: all 0.2s ease;

		&:hover {
			border-color: var(--bulma-info);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}

		&.is-selected {
			border-color: var(--bulma-success);
		}

		&.is-expanded {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		}
	}

	.scene-header {
		display: flex;
		align-items: center;
		padding: 1rem;
		cursor: pointer;
		user-select: none;
		transition: background-color 0.2s ease;

		&:hover {
			background: rgba(0, 0, 0, 0.02);
		}
	}

	.scene-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.layout-preview-container {
		flex-shrink: 0;
	}

	.scene-text-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.scene-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--bulma-text-strong);
		margin: 0;
	}

	.scene-tags {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.scene-details {
		padding: 0 1rem 1rem 1rem;
		background: var(--bulma-background);
		border-top: 1px solid var(--bulma-border);
	}

	.field {
		margin-bottom: 1.5rem;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.label {
		font-weight: 600;
		color: var(--bulma-text-strong);
		margin-bottom: 0.75rem;
	}

	// Video Grid Section - Most Prominent
	.video-grid-container {
		padding: 1rem;
		background: var(--bulma-scheme-main-bis);
		border: 2px solid var(--bulma-primary-light);
		border-radius: var(--bulma-radius);
		margin-bottom: 0.5rem;
	}

	.video-grid {
		display: grid;
		gap: 0.5rem;
		width: 100%;

		&.has-1-cols {
			grid-template-columns: 1fr;
		}
		&.has-2-cols {
			grid-template-columns: 1fr 1fr;
		}
		&.has-3-cols {
			grid-template-columns: 1fr 1fr 1fr;
		}
		&.has-4-cols {
			grid-template-columns: 1fr 1fr 1fr 1fr;
		}
	}

	.video-cell {
		aspect-ratio: 16/9;
		border: 2px solid var(--bulma-border);
		border-radius: var(--bulma-radius-small);
		background: var(--bulma-scheme-main-bis);
		position: relative;
		overflow: hidden;

		&::before {
			content: attr(data-position);
			position: absolute;
			top: 0.25rem;
			left: 0.25rem;
			background: var(--bulma-primary);
			color: var(--bulma-primary-invert);
			font-size: 0.7rem;
			font-weight: 600;
			padding: 0.1rem 0.3rem;
			border-radius: var(--bulma-radius-small);
			z-index: 1;
		}
	}

	.cell-content {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem;

		&.empty-cell {
			background: var(--bulma-grey-lighter);
			color: var(--bulma-grey-dark);
		}

		&.chat-cell {
			background: var(--bulma-info-light);
			color: var(--bulma-info-dark);
		}

		&.actor-cell {
			background: var(--bulma-primary-light);
			color: var(--bulma-primary-dark);
		}
	}

	.cell-icon {
		font-size: 1.2rem;
		opacity: 0.8;
	}

	.cell-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-align: center;
	}

	.actor-select {
		width: 100%;
		height: 100%;
		padding: 0.25rem;
		font-size: 0.7rem;
		border: none;
		border-radius: var(--bulma-radius-small);
		background: transparent;
		color: var(--bulma-primary-dark);
		cursor: pointer;
		font-weight: 500;
		text-align: center;
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;

		&:focus {
			outline: 2px solid var(--bulma-primary);
			outline-offset: -2px;
			background: rgba(255, 255, 255, 0.1);
		}

		&:hover {
			background: rgba(255, 255, 255, 0.05);
		}
	}

	// Properties Section
	.property-summary {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.property-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.property-tag {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: var(--bulma-radius);
		font-size: 0.875rem;
		background: var(--bulma-grey-lighter);
		opacity: 0.5;
		transition: all 0.2s ease;
		flex-shrink: 0;

		&.enabled {
			background: var(--bulma-success-light);
			opacity: 1;
		}
	}

	.property-desc {
		font-size: 0.8rem;
		color: var(--bulma-text);
		font-weight: 500;
	}

	// Responsive design
	@media screen and (max-width: 768px) {
		.scene-header {
			padding: 0.75rem;
		}

		.scene-info {
			gap: 0.5rem;
		}

		.scene-text-info {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.video-grid {
			padding: 0.5rem;
		}

		.video-cell {
			aspect-ratio: 4/3;
		}

		.cell-content {
			font-size: 0.65rem;
			gap: 0.125rem;
		}

		.actor-select {
			font-size: 0.6rem;
		}

		.property-summary {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
	}
</style>
