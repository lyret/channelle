<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import IconMessageCircle from "../icons/Icon-message-circle.svelte";
	import IconUser from "../icons/Icon-user.svelte";
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
			<h3 class="scene-title">{layout.name}</h3>
			<div class="scene-tags">
				{#if layout.chatEnabled}
					<span class="tag is-small is-info">💬</span>
				{/if}
				{#if layout.visitorAudioEnabled}
					<span class="tag is-small is-success">🎤</span>
				{/if}
				{#if layout.visitorVideoEnabled}
					<span class="tag is-small is-success">📹</span>
				{/if}
				{#if layout.effectsEnabled}
					<span class="tag is-small is-primary">✨</span>
				{/if}
			</div>
		</div>
		<button class="expand-toggle" class:is-rotated={expanded}>
			<span class="expand-icon">▼</span>
		</button>
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
												<span class="cell-icon"><IconUser /></span>
												<span class="cell-label">Tom</span>
											</div>
										{:else if cell.type == "chat"}
											<div class="cell-content chat-cell">
												<span class="cell-icon"><IconMessageCircle /></span>
												<span class="cell-label">Chat</span>
											</div>
										{:else if cell.type == "actor"}
											<div class="cell-content actor-cell">
												<div class="actor-selector">
													<select on:change={(e) => onChange(e, cell)} on:click={(e) => e.stopPropagation()}>
														<option value={-1}>- Ingen aktör -</option>
														{#each peers as peer (peer.id)}
															<option value={peer.id} selected={cell.peerId == peer.id.toString()}>
																{peer.name}
															</option>
														{/each}
													</select>
												</div>
											</div>
										{/if}
									</div>
								{/each}
							{/each}
						</div>
					</div>
				{:else}
					<div class="auto-layout-notice">
						<span class="auto-icon">🤖</span>
						<span>Automatisk layout - anpassas efter antal aktörer</span>
					</div>
				{/if}
			</div>

			<!-- Scene Properties -->
			<div class="field">
				<label class="label">Sceninställningar</label>
				<div class="property-list">
					<div class="property-item">
						<span class="property-label">Chat</span>
						<span class="property-value" class:enabled={layout.chatEnabled}>
							{layout.chatEnabled ? "Aktiverad" : "Inaktiverad"}
						</span>
					</div>
					<div class="property-item">
						<span class="property-label">Publikens ljud</span>
						<span class="property-value" class:enabled={layout.visitorAudioEnabled}>
							{layout.visitorAudioEnabled ? "Tillåtet" : "Ej tillåtet"}
						</span>
					</div>
					<div class="property-item">
						<span class="property-label">Publikens video</span>
						<span class="property-value" class:enabled={layout.visitorVideoEnabled}>
							{layout.visitorVideoEnabled ? "Tillåtet" : "Ej tillåtet"}
						</span>
					</div>
					<div class="property-item">
						<span class="property-label">Effekter</span>
						<span class="property-value" class:enabled={layout.effectsEnabled}>
							{layout.effectsEnabled ? "Aktiverade" : "Inaktiverade"}
						</span>
					</div>
				</div>
			</div>

			<!-- Activation Controls -->
			<div class="field is-grouped">
				<div class="control is-expanded">
					<button class="button is-primary is-fullwidth" class:is-outlined={!selected} on:click={activateScene} disabled={selected}>
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
			border-color: var(--bulma-primary);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}

		&.is-selected {
			border-color: var(--bulma-primary);
			background: var(--bulma-primary-light);
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

	.expand-toggle {
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		border-radius: var(--bulma-radius-small);
		transition: all 0.2s ease;
		color: var(--bulma-text);

		&:hover {
			background: var(--bulma-background);
			color: var(--bulma-primary);
		}

		&.is-rotated .expand-icon {
			transform: rotate(180deg);
		}
	}

	.expand-icon {
		display: inline-block;
		transition: transform 0.2s ease;
		font-size: 0.75rem;
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

	.actor-selector {
		width: 100%;
		padding: 0.25rem;

		select {
			width: 100%;
			padding: 0.25rem;
			font-size: 0.7rem;
			border: none;
			border-radius: var(--bulma-radius-small);
			background: var(--bulma-scheme-main);
			color: var(--bulma-text);
			cursor: pointer;

			&:focus {
				outline: 2px solid var(--bulma-primary);
				outline-offset: 1px;
			}
		}
	}

	.auto-layout-notice {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--bulma-info-light);
		border-radius: var(--bulma-radius);
		color: var(--bulma-info-dark);
		font-size: 0.875rem;

		.auto-icon {
			font-size: 1.25rem;
		}
	}

	// Properties Section
	.property-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.property-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem;
		background: var(--bulma-background);
		border-radius: var(--bulma-radius-small);
		border: 1px solid var(--bulma-border-light);
	}

	.property-label {
		font-size: 0.875rem;
		color: var(--bulma-text);
		font-weight: 500;
	}

	.property-value {
		font-size: 0.8rem;
		padding: 0.25rem 0.5rem;
		border-radius: var(--bulma-radius-small);
		font-weight: 600;

		&.enabled {
			background: var(--bulma-success-light);
			color: var(--bulma-success-dark);
		}

		&:not(.enabled) {
			background: var(--bulma-grey-lighter);
			color: var(--bulma-grey-dark);
		}
	}

	// Responsive design
	@media screen and (max-width: 768px) {
		.scene-header {
			padding: 0.75rem;
		}

		.scene-info {
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

		.actor-selector select {
			font-size: 0.6rem;
		}
	}
</style>
