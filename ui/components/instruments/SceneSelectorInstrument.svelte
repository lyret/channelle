<script lang="ts">
	import type { Scene } from "~/types/serverSideTypes";
	import SceneSelectorControl from "./_SceneSelectorControl.svelte";
	import Accordion from "../Accordion.svelte";
	import { onMount } from "svelte";
	import { peersStore } from "~/api/media";
	import { configManager, currentSceneStore } from "~/api/config";
	import { stageChatEnabledStore } from "~/api/media";

	$: peers = Object.values($peersStore || {}).filter((p) => (p.actor || p.manager) && !p.banned);

	const auto: Scene = {
		name: "Automatisk",
		chatEnabled: true,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: false,
		visitorVideoEnabled: false,
		layout: [],
	};
	const empty: Scene = {
		name: "Helt tom",
		chatEnabled: true,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: false,
		visitorVideoEnabled: false,
		layout: [[{ type: "empty" }]],
	};
	const chat: Scene = {
		name: "Chatduell",
		chatEnabled: false,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: true,
		visitorVideoEnabled: true,
		layout: [[{ type: "actor", peerId: "-1" }, { type: "chat" }, { type: "actor", peerId: "-1" }]],
	};
	const oneXOne: Scene = {
		name: "En i fokus",
		chatEnabled: true,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: true,
		visitorVideoEnabled: true,
		layout: [[{ type: "actor", peerId: "-1" }]],
	};
	const oneXTwo: Scene = {
		name: "Två bredvid varandra",
		chatEnabled: true,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: true,
		visitorVideoEnabled: true,
		layout: [
			[
				{ type: "actor", peerId: "-1" },
				{ type: "actor", peerId: "-1" },
			],
		],
	};
	const twoXTwo: Scene = {
		name: "Fyra rutor",
		chatEnabled: true,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: true,
		visitorVideoEnabled: true,
		layout: [
			[
				{ type: "actor", peerId: "-1" },
				{ type: "actor", peerId: "-1" },
			],
			[
				{ type: "actor", peerId: "-1" },
				{ type: "actor", peerId: "-1" },
			],
		],
	};

	// Sync actual stage stores when the selected scene changes
	onMount(() => {
		const stop = currentSceneStore.subscribe((scene) => {
			if (scene) {
				stageChatEnabledStore.set(scene?.chatEnabled || false);
			}
		});

		return () => {
			stop();
		};
	});

	// const doDesignTest = (style: "simple" | "ukraine") => {
	// 	if (style == "simple") {
	// 		document.documentElement.style.setProperty("--channelle-main-bg-color", "black");
	// 		document.documentElement.style.setProperty("--channelle-main-text-color", "white");
	// 		document.documentElement.style.setProperty("--channelle-menu-bg-color", "black");
	// 		document.documentElement.style.setProperty("--channelle-menu-text-color", " white");
	// 	} else {
	// 		document.documentElement.style.setProperty("--channelle-main-bg-color", "blue");
	// 		document.documentElement.style.setProperty("--channelle-main-text-color", "yellow");
	// 		document.documentElement.style.setProperty("--channelle-menu-bg-color", "yellow");
	// 		document.documentElement.style.setProperty("--channelle-menu-text-color", " red");
	// 	}
	// document.documentElement.style.setProperty("--bulma-primary-h", "246deg");
	// document.documentElement.style.setProperty("--bulma-primary-s", "100%");
	// document.documentElement.style.setProperty("--bulma-primary-l", "48.4%");
	// document.documentElement.style.setProperty("--bulma-info-h", "60deg");
	// document.documentElement.style.setProperty("--bulma-info-s", "100%");
	// document.documentElement.style.setProperty("--bulma-info-l", "63.7%");
	// document.documentElement.style.setProperty("--bulma-scheme-h", "60deg");
	// document.documentElement.style.setProperty("--bulma-scheme-s", "100%");
	// document.documentElement.style.setProperty("--bulma-scheme-l", "63.7%");
	// document.documentElement.style.setProperty(
	// 	"--bulma-scheme-main-l",
	// 	"63.7%"
	// );
	// document.documentElement.style.setProperty("--bulma-link-h", "317deg");
	// document.documentElement.style.setProperty("--bulma-link-s", "41.2%");
	// document.documentElement.style.setProperty("--bulma-link-l", "93.3%");
	// document.documentElement.style.setProperty("--bulma-link-l", "93.3%");
	// document.documentElement.style.setProperty("--bulma-link-l", "93.3%");

	// document.documentElement.style.setProperty(
	// 	"--bulma-black",
	// 	"var(--bulma-primary)"
	// );
	// document.documentElement.style.setProperty(
	// 	"--bulma-button-static-background-color",
	// 	"var(--bulma-black)"
	// );
	// document.documentElement.style.setProperty(
	// 	"--bulma-body-background-color",
	// 	"var(--bulma-black)"
	// );
	//};
</script>

<div class="scene-selector-instrument">
	<h1 class="title">Sceninställningar</h1>

	<div class="scene-content">
		<Accordion title="Ange tvingande inställningar" isOpen={false}>
			<div class="field">
				<label class="label">Visa ridån 🎭</label>
				<div class="control">
					<div class="buttons has-addons">
						<button class="button is-danger" on:click={() => configManager.updateCurtainsOverride(2)}> Dölj </button>
						<button class="button is-info" on:click={() => configManager.updateCurtainsOverride(0)}> Automatiskt </button>
						<button class="button is-success" on:click={() => configManager.updateCurtainsOverride(1)}> Visa </button>
					</div>
				</div>
				<div class="help-section">
					<p class="help">Dessa inställningar gäller oavsett vilken scen som är aktiv</p>
				</div>
			</div>

			<div class="field">
				<label class="label">Visa chatt-panelen 💬</label>
				<div class="control">
					<div class="buttons has-addons">
						<button class="button is-danger" on:click={() => configManager.updateChatEnabledOverride(2)}> Dölj </button>
						<button class="button is-info" on:click={() => configManager.updateChatEnabledOverride(0)}> Automatiskt </button>
						<button class="button is-success" on:click={() => configManager.updateChatEnabledOverride(1)}> Visa </button>
					</div>
				</div>
			</div>

			<div class="field">
				<label class="label">Tillåt video från publiken 🤳</label>
				<div class="control">
					<div class="buttons has-addons">
						<button class="button is-danger" on:click={() => configManager.updateVisitorVideoEnabledOverride(2)}> Nej </button>
						<button class="button is-info" on:click={() => configManager.updateVisitorVideoEnabledOverride(0)}> Automatiskt </button>
						<button class="button is-success" on:click={() => configManager.updateVisitorVideoEnabledOverride(1)}> Ja </button>
					</div>
				</div>
			</div>

			<div class="field">
				<label class="label">Tillåt ljud från publiken 🎤</label>
				<div class="control">
					<div class="buttons has-addons">
						<button class="button is-danger" on:click={() => configManager.updateVisitorAudioEnabledOverride(2)}> Nej </button>
						<button class="button is-info" on:click={() => configManager.updateVisitorAudioEnabledOverride(0)}> Automatiskt </button>
						<button class="button is-success" on:click={() => configManager.updateVisitorAudioEnabledOverride(1)}> Ja </button>
					</div>
				</div>
			</div>

			<div class="field">
				<label class="label">Tillåt blommor och applåder 🌹👏</label>
				<div class="control">
					<div class="buttons has-addons">
						<button class="button is-danger" on:click={() => configManager.updateEffectsEnabledOverride(2)}> Nej </button>
						<button class="button is-info" on:click={() => configManager.updateEffectsEnabledOverride(0)}> Automatiskt </button>
						<button class="button is-success" on:click={() => configManager.updateEffectsEnabledOverride(1)}> Ja </button>
					</div>
				</div>
			</div>
		</Accordion>

		<div class="field">
			<label class="label">Välj aktiv scen</label>
			<div class="scene-controls">
				<SceneSelectorControl layout={auto} {peers} selectedLayout={$currentSceneStore} on:select={(e) => configManager.updateCurrentScene(e.detail)} />
				<SceneSelectorControl
					layout={empty}
					{peers}
					selectedLayout={$currentSceneStore}
					on:select={(e) => configManager.updateCurrentScene(e.detail)}
				/>
				<SceneSelectorControl
					layout={oneXOne}
					{peers}
					selectedLayout={$currentSceneStore}
					on:select={(e) => configManager.updateCurrentScene(e.detail)}
				/>
				<SceneSelectorControl
					layout={oneXTwo}
					{peers}
					selectedLayout={$currentSceneStore}
					on:select={(e) => configManager.updateCurrentScene(e.detail)}
				/>
				<SceneSelectorControl layout={chat} {peers} selectedLayout={$currentSceneStore} on:select={(e) => configManager.updateCurrentScene(e.detail)} />
				<SceneSelectorControl
					layout={twoXTwo}
					{peers}
					selectedLayout={$currentSceneStore}
					on:select={(e) => configManager.updateCurrentScene(e.detail)}
				/>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.scene-selector-instrument {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.scene-content {
		flex: 1;
		overflow-y: auto;
	}

	.field {
		margin-bottom: 1.5rem;
	}

	.label {
		font-weight: 600;
		color: var(--bulma-text-strong);
		margin-bottom: 0.5rem;
	}

	.notification {
		margin-bottom: 1rem;

		p {
			margin-bottom: 0;
		}
	}

	.help {
		margin-top: 0.25rem;
		font-size: 0.75rem;
	}

	.help-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.25rem;
		flex-wrap: wrap;
		gap: 0.5rem;

		.help {
			margin-top: 0;
		}
	}

	.buttons {
		&.has-addons {
			justify-content: flex-start;
		}
	}

	.scene-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	// Responsive adjustments
	@media screen and (max-width: 768px) {
		.buttons {
			&.has-addons {
				flex-direction: column;

				.button {
					border-radius: var(--bulma-radius) !important;
					margin-bottom: 0.25rem;
				}
			}
		}
	}
</style>
