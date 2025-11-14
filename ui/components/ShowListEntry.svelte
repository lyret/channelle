<script lang="ts">
	import { isTheaterAuthenticated } from "~/api/auth";
	import { canLaunchStore, launcherLoadingStore, launchInstance, instancesStore, stopInstance } from "~/api/launchers";
	import PicolEdit from "./picol/icons/Picol-edit.svelte";
	import PicolControlsPlay from "./picol/icons/Picol-controls-play.svelte";
	import PicolArrowFullUpperright from "./picol/icons/Picol-arrow-full-upperright.svelte";
	import PicolStop from "./picol/icons/Picol-controls-stop.svelte";
	import PicolCopy from "./picol/icons/Picol-copy.svelte";
	import type { ShowAttributes } from "~/api/shows";

	export let show: ShowAttributes;

	let isLaunching = false;
	let isStopping = false;
	let copyButtonText = "";

	// Check if this show has any running instances (should only be one per show)
	$: showInstances = $instancesStore.filter((instance) => instance.showId === show.id);
	$: runningInstance = showInstances.find((instance) => instance.status === "running" || instance.status === "starting");

	// Determine show status - use server isOnline for all users, fallback to client-side for authenticated users
	$: showStatus = show.isOnline ? "online" : show.lastOnlineAt !== null ? "tidigare" : "kommande";
	$: statusLabel = showStatus === "online" ? "Online nu!" : showStatus === "tidigare" ? "Tidigare" : "Kommande";
	$: statusClass = showStatus === "online" ? "is-success" : showStatus === "tidigare" ? "is-dark" : "is-warning";

	// Use the correct URL - show.url already contains the correct URL (instance URL when online)
	$: currentUrl = show.url;

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

	function formatLastOnlineDate(lastOnlineAt: string | Date | null): string {
		if (!lastOnlineAt) return "";
		const date = typeof lastOnlineAt === "string" ? new Date(lastOnlineAt) : lastOnlineAt;
		return date.toLocaleDateString("sv-SE", {
			year: "numeric",
			month: "long",
			day: "numeric",
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

	async function handleLaunch() {
		if (isLaunching || !$canLaunchStore || !confirm("Är du säker på att du vill starta en ny server?")) {
			return;
		}

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
		if (isStopping || !runningInstance || !confirm("Är du säker på att du vill stoppa den här servern?")) {
			return;
		}

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

	async function handleCopyUrl() {
		try {
			await navigator.clipboard.writeText(currentUrl);
			copyButtonText = "Kopierad!";
			setTimeout(() => {
				copyButtonText = "";
			}, 2000);
		} catch (error) {
			console.error("Failed to copy URL:", error);
			copyButtonText = "Misslyckades";
			setTimeout(() => {
				copyButtonText = "";
			}, 2000);
		}
	}
</script>

<div class="notification" class:online={showStatus === "online"}>
	<div class="level is-mobile">
		<div class="level-left">
			<div class="level-item">
				<div>
					<p class="title is-6 is-family-title">
						{show.name}
						<span class="tag {statusClass} ml-4">
							{statusLabel}
						</span>
					</p>
					{#if show.description}
						<p class="subtitle is-7 is-family-secondary mt-2">{show.description}</p>
					{/if}
					<!-- Only show URL for authenticated users or when show is online/tidigare -->
					{#if showStatus === "online"}
						<div class="url-display mt-4">
							<code class="show-url">{currentUrl}</code>
							<button class="button is-small is-outlined copy-url-button" on:click={handleCopyUrl} title="Kopiera URL">
								<span class="icon is-small">
									<PicolCopy />
								</span>
								{#if copyButtonText}
									<span class="copy-feedback">{copyButtonText}</span>
								{/if}
							</button>
						</div>
					{:else if showStatus === "kommande"}
						<p class="is-size-7 has-text-grey-light mt-4">
							<em>{show.nomenclature} har inte startat ännu</em>
						</p>
					{/if}

					<!-- Show last online date for "tidigare" shows -->
					{#if showStatus === "tidigare" && show.lastOnlineAt !== null}
						<p class="is-size-7 has-text-grey-light mt-4">
							<strong>Senast visad:</strong>
							{formatLastOnlineDate(show.lastOnlineAt)}
						</p>
					{/if}

					<!-- Instance details - only show if authenticated and show is online -->
					{#if $isTheaterAuthenticated && showStatus === "online" && runningInstance}
						<div class="instance-details">
							<div class="instance-meta">
								<span class="instance-status-detail is-size-7">
									<strong>Status:</strong>
									{runningInstance.status === "starting" ? "Startar..." : "Körs"}
								</span>
								<span class="instance-id-detail is-size-7">
									<strong>ID:</strong>
									{formatInstanceId(runningInstance.instanceId)}
								</span>
								{#if runningInstance.port}
									<span class="instance-port-detail is-size-7">
										<strong>Port:</strong>
										{runningInstance.port}
									</span>
								{/if}
								<span class="instance-adapter-detail is-size-7">
									<strong>Adapter:</strong>
									{getAdapterDisplayName(runningInstance.metadata)}
								</span>
								<span class="instance-time-detail is-size-7">
									<strong>Startad:</strong>
									{formatDate(runningInstance.createdAt)}
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
					{#if showStatus === "online"}
						<a href={currentUrl} target="_blank" class="button is-small is-secondary">
							Besök&nbsp;&nbsp;
							<span class="icon is-small">
								<PicolArrowFullUpperright />
							</span>
						</a>
						{#if $isTheaterAuthenticated && runningInstance}
							<button
								class="button is-small is-danger is-outlined"
								class:is-loading={isStopping}
								disabled={isStopping}
								on:click={handleStop}
								title="Stoppa server"
							>
								<span class="icon is-small">
									<PicolStop />
								</span><span>Stoppa</span>
							</button>
						{/if}
					{:else if showStatus === "kommande" && $isTheaterAuthenticated}
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
						<a href={`/preparation?show=${show.id}`} class="button is-small is-secondary">
							<span class="icon is-small">
								<PicolEdit />
							</span><span>Förbered</span>
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.notification {
		border-top-left-radius: 28px;
		border-top-right-radius: 28px;
		border-bottom-left-radius: 28px;
		border-bottom-right-radius: 0px;
		max-width: 100%;
		overflow: hidden;
	}
	.notification.online {
		border-top-left-radius: 28px;
		border-top-right-radius: 28px;
		border-bottom-left-radius: 0px;
		border-bottom-right-radius: 28px;
	}

	.tag {
		border-radius: 14px;
		flex-shrink: 0;
	}

	.title {
		word-wrap: break-word;
		overflow-wrap: break-word;
		min-width: 0;
	}

	.subtitle {
		word-wrap: break-word;
		overflow-wrap: break-word;
		min-width: 0;
	}

	.level {
		align-items: flex-start;
		margin-bottom: 0;
	}

	.level-left,
	.level-right {
		min-width: 0;
	}

	.level-left {
		align-items: flex-start;
		flex: 1;
		margin-right: 1rem;
	}

	.level-right {
		flex-shrink: 0;
		margin-left: 0;
	}

	.level-item {
		justify-content: flex-start;
		min-width: 0;
		flex-grow: 0;
		flex-shrink: 1;
	}

	.running-tag {
		margin-left: 0.5rem;
		align-self: center;
	}

	.buttons {
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.instance-details {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		max-width: 100%;
		overflow: hidden;
	}

	.instance-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 0.5rem;
		max-width: 100%;
	}

	.instance-meta span {
		color: var(--channelle-menu-text-color);
		opacity: 0.8;
		white-space: nowrap;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.instance-url {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-width: 100%;
		overflow: hidden;
	}

	.instance-url code {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		word-break: break-all;
		overflow-wrap: break-word;
		max-width: 100%;
		overflow: hidden;
	}

	.url-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
		max-width: 100%;
		overflow: hidden;
	}

	.show-url {
		background-color: rgba(255, 255, 255, 0.08);
		color: var(--channelle-menu-text-color);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		flex: 1;
		word-break: break-all;
		border: 1px solid rgba(255, 255, 255, 0.1);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.copy-url-button {
		background-color: transparent;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: var(--channelle-menu-text-color);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		transition: all 0.2s ease;
		position: relative;
		min-width: 2rem;
		height: 2rem;
		flex-shrink: 0;
	}

	.copy-url-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	.copy-feedback {
		position: absolute;
		top: -1.5rem;
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.7rem;
		white-space: nowrap;
		z-index: 10;
	}

	@media screen and (max-width: 1024px) {
		.level {
			flex-direction: column;
			align-items: stretch;
		}

		.level-left {
			margin-right: 0;
			margin-bottom: 1rem;
		}

		.level-right {
			width: 100%;
		}

		.buttons {
			justify-content: flex-start;
			width: 100%;
		}
	}

	@media screen and (max-width: 768px) {
		.instance-meta {
			gap: 0.5rem;
			flex-direction: column;
		}

		.instance-meta span {
			font-size: 0.75rem;
			white-space: normal;
			word-break: break-word;
		}

		.url-display {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.show-url {
			text-overflow: unset;
			white-space: normal;
			word-break: break-all;
		}

		.copy-url-button {
			align-self: flex-end;
			min-width: 2.5rem;
		}

		.buttons {
			flex-direction: column;
			width: 100%;
		}

		.button {
			width: 100%;
			justify-content: center;
		}

		.title {
			font-size: 1.1rem !important;
		}

		.subtitle {
			font-size: 0.8rem !important;
		}
	}
</style>
