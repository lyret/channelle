<script lang="ts">
	import { isTheaterAuthenticated } from "~/stores/theaterAuth";
	import { canLaunchStore, launcherLoadingStore, launchInstance, instancesStore, stopInstance } from "~/api/launchers";
	import PicolEdit from "./picol/icons/Picol-edit.svelte";
	import PicolControlsPlay from "./picol/icons/Picol-controls-play.svelte";
	import PicolArrowFullUpperright from "./picol/icons/Picol-arrow-full-upperright.svelte";
	import PicolStop from "./picol/icons/Picol-controls-stop.svelte";

	import type { ShowListItem } from "~/types/serverSideTypes";

	export let show: ShowListItem;

	let isLaunching = false;
	let isStopping = false;

	// Check if this show has any running instances (should only be one per show)
	$: showInstances = $instancesStore.filter((instance) => instance.showId === show.id);
	$: runningInstance = showInstances.find((instance) => instance.status === "running" || instance.status === "starting");

	// Helper functions for display
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleString("sv-SE", {
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	function formatInstanceId(instanceId: string): string {
		return instanceId.length > 8 ? instanceId.slice(-8) : instanceId;
	}

	function getAdapterDisplayName(metadata: Record<string, any> | undefined): string {
		if (!metadata) return "Okänd";
		const adapterNames = {
			local: "Samma server",
			digitalocean: "DigitalOcean",
		};
		const method = metadata.launchMethod;
		return adapterNames[method as keyof typeof adapterNames] || method || "Okänd";
	}

	function handleViewStage() {
		if (runningInstance) {
			window.open(runningInstance.url, "_blank");
		} else {
			window.open(show.url, "_blank");
		}
	}

	async function handleLaunch() {
		if (isLaunching || !$canLaunchStore) return;

		isLaunching = true;
		try {
			const result = await launchInstance(show.id);
			if (result.success && result.url) {
				// Optional: Auto-open the launched instance
				setTimeout(() => {
					window.open(result.url, "_blank");
				}, 2000);
			}
		} finally {
			isLaunching = false;
		}
	}

	async function handleStop() {
		if (isStopping || !runningInstance) return;

		isStopping = true;
		try {
			const result = await stopInstance(runningInstance.instanceId);
			if (!result.success) {
				console.error("Failed to stop instance:", result.message);
			}
		} finally {
			isStopping = false;
		}
	}
</script>

<div class="notification" class:online={show.isOnline}>
	<div class="level is-mobile">
		<div class="level-left">
			<div class="level-item">
				<div>
					<p class="title is-6 is-family-title">
						{show.name}
						<span class="tag" class:is-success={show.isOnline} class:is-dark={!show.isOnline}>
							{show.isOnline ? "Online!" : "Kommmande"}
						</span>
					</p>
					{#if show.description}
						<p class="subtitle is-7 is-family-secondary">{show.description}</p>
					{/if}
					<p class="is-size-7 has-text-grey">
						<code>{show.url}</code>
					</p>

					<!-- Instance details - only show if authenticated and instance is running -->
					{#if $isTheaterAuthenticated && runningInstance}
						<div class="instance-details">
							<div class="instance-meta">
								<span class="instance-status-detail is-size-7">
									<strong>Status:</strong> {runningInstance.status === "starting" ? "Startar..." : "Körs"}
								</span>
								<span class="instance-id-detail is-size-7">
									<strong>ID:</strong> {formatInstanceId(runningInstance.instanceId)}
								</span>
								{#if runningInstance.port}
									<span class="instance-port-detail is-size-7">
										<strong>Port:</strong> {runningInstance.port}
									</span>
								{/if}
								<span class="instance-adapter-detail is-size-7">
									<strong>Adapter:</strong> {getAdapterDisplayName(runningInstance.metadata)}
								</span>
								<span class="instance-time-detail is-size-7">
									<strong>Startad:</strong> {formatDate(runningInstance.createdAt)}
								</span>
							</div>
							{#if runningInstance.url !== show.url}
								<div class="instance-url">
									<span class="is-size-7 has-text-grey-light">
										<strong>Instance URL:</strong>
									</span>
									<code class="is-size-7">{runningInstance.url}</code>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
		<div class="level-right">
			<div class="level-item">
				<div class="buttons">
					{#if show.isOnline}
						<a href={show.url} target="_blank" class="button is-small is-secondary">
							Öppna&nbsp;&nbsp;
							<span class="icon is-small">
								<PicolArrowFullUpperright />
							</span>
						</a>
					{:else if $isTheaterAuthenticated}
						<a class="button is-small is-secondary" href="/preparation?show={show.id}">
							<span class="icon is-size-8">
								<PicolEdit />
							</span><span>Förbered</span></a
						>

						{#if runningInstance}
							<!-- Show has running instance - show view and stop buttons -->
							<button class="button is-small is-success" on:click={handleViewStage}>
								<span class="icon is-size-8">
									<PicolArrowFullUpperright />
								</span><span>Visa</span>
							</button>
							<button
								class="button is-small is-danger is-outlined"
								class:is-loading={isStopping}
								disabled={isStopping}
								on:click={handleStop}
								title="Stoppa instans"
							>
								<span class="icon is-size-8">
									<PicolStop />
								</span><span>Stoppa</span>
							</button>
							<span class="tag is-success is-small running-tag">
								{runningInstance.status === "starting" ? "Startar..." : "Körs"}
							</span>
						{:else}
							<!-- No running instance - show launch button -->
							<button
								class="button is-small is-secondary"
								class:is-loading={isLaunching || $launcherLoadingStore}
								disabled={!$canLaunchStore || isLaunching || $launcherLoadingStore}
								on:click={handleLaunch}
								title={$canLaunchStore ? "Launch new stage instance" : "Launcher not ready"}
							>
								<span class="icon is-size-8">
									<PicolControlsPlay />
								</span><span>Lansera</span>
							</button>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.tag {
		border-radius: 28px;
	}
	.notification {
		border-top-left-radius: 28px;
		border-top-right-radius: 28px;
		border-bottom-left-radius: 28px;
		border-bottom-right-radius: 0px;
	}
	.notification.online {
		border-top-left-radius: 28px;
		border-top-right-radius: 28px;
		border-bottom-left-radius: 0px;
		border-bottom-right-radius: 28px;
	}

	.running-tag {
		margin-left: 0.5rem;
		align-self: center;
	}

	.buttons {
		align-items: center;
	}

	.instance-details {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.instance-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.instance-meta span {
		color: var(--channelle-menu-text-color);
		opacity: 0.8;
		white-space: nowrap;
	}

	.instance-url {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.instance-url code {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		word-break: break-all;
	}

	@media screen and (max-width: 768px) {
		.instance-meta {
			gap: 0.75rem;
		}

		.instance-meta span {
			font-size: 0.75rem;
		}
	}
</style>
