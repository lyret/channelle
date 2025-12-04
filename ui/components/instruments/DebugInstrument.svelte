<script lang="ts">
	import { debugModeStore } from "~/stores/debug";

	import { currentPeerStore } from "~/api/auth";
	import { mediaDebugStore, currentPeerMediaStateStore } from "~/api/stageNew/peerMedia";

	$: debugInfo = $mediaDebugStore;
	$: mediaState = $currentPeerMediaStateStore;
	$: peer = $currentPeerStore;
</script>

<div class="debug-instrument">
	<h1 class="title mb-4">Diagnostik</h1>

	<div class="field">
		<label class="checkbox">
			<input type="checkbox" bind:checked={$debugModeStore} />
			<span class="ml-2">Visa debug-information över videos</span>
		</label>
		<p class="help is-size-7 mt-1">Visar diagnostikisk användbar information över video elementen på scenen</p>
	</div>

	<div class="field">
		<h2 class="subtitle is-6 mb-2">Media State Debug</h2>
		{#if debugInfo && mediaState}
			<div class="box is-size-7 p-3">
				<h5 class="title is-6 mb-3">📡 Media State</h5>

				<table class="table is-fullwidth is-size-7">
					<tbody>
						<tr>
							<td><strong>Peer ID</strong></td>
							<td class="has-text-right">{debugInfo.myPeerId.slice(0, 8)}...</td>
						</tr>
						<tr>
							<td><strong>Role</strong></td>
							<td class="has-text-right">
								{#if peer?.manager}
									<span class="tag is-small is-info">Manager</span>
								{:else if peer?.actor}
									<span class="tag is-small is-primary">Actor</span>
								{:else}
									<span class="tag is-small">Visitor</span>
								{/if}
							</td>
						</tr>
						<tr>
							<td><strong>On Stage</strong></td>
							<td class="has-text-right">
								<span class="tag is-small" class:is-success={debugInfo.isOnStage} class:is-light={!debugInfo.isOnStage}>
									{debugInfo.isOnStage ? "Yes" : "No"}
								</span>
							</td>
						</tr>
					</tbody>
				</table>

				<hr class="my-2" />

				<table class="table is-fullwidth is-size-7">
					<thead>
						<tr>
							<th colspan="2">Permissions</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Audio</td>
							<td class="has-text-right">
								<span
									class="tag is-small"
									class:is-success={debugInfo.permissions.audioAllowed}
									class:is-danger={!debugInfo.permissions.audioAllowed}
								>
									{debugInfo.permissions.audioAllowed ? "Allowed" : "Blocked"}
								</span>
							</td>
						</tr>
						<tr>
							<td>Video</td>
							<td class="has-text-right">
								<span
									class="tag is-small"
									class:is-success={debugInfo.permissions.videoAllowed}
									class:is-danger={!debugInfo.permissions.videoAllowed}
								>
									{debugInfo.permissions.videoAllowed ? "Allowed" : "Blocked"}
								</span>
							</td>
						</tr>
					</tbody>
				</table>

				<hr class="my-2" />

				<table class="table is-fullwidth is-size-7">
					<thead>
						<tr>
							<th colspan="2">Database Mute</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Audio</td>
							<td class="has-text-right">
								<span class="tag is-small" class:is-danger={mediaState.audioMuted} class:is-light={!mediaState.audioMuted}>
									{mediaState.audioMuted ? "Muted" : "Open"}
								</span>
							</td>
						</tr>
						<tr>
							<td>Video</td>
							<td class="has-text-right">
								<span class="tag is-small" class:is-danger={mediaState.videoMuted} class:is-light={!mediaState.videoMuted}>
									{mediaState.videoMuted ? "Muted" : "Open"}
								</span>
							</td>
						</tr>
					</tbody>
				</table>

				<hr class="my-2" />

				<table class="table is-fullwidth is-size-7">
					<thead>
						<tr>
							<th>Stream</th>
							<th class="has-text-right">Tracks</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Audio</td>
							<td class="has-text-right">
								<span
									class="tag is-small"
									class:is-success={debugInfo.localStreamTracks.audio > 0}
									class:is-light={debugInfo.localStreamTracks.audio === 0}
								>
									{debugInfo.localStreamTracks.audio}
								</span>
							</td>
						</tr>
						<tr>
							<td>Video</td>
							<td class="has-text-right">
								<span
									class="tag is-small"
									class:is-success={debugInfo.localStreamTracks.video > 0}
									class:is-light={debugInfo.localStreamTracks.video === 0}
								>
									{debugInfo.localStreamTracks.video}
								</span>
							</td>
						</tr>
					</tbody>
				</table>

				<hr class="my-2" />

				<table class="table is-fullwidth is-size-7">
					<thead>
						<tr>
							<th>Producer</th>
							<th class="has-text-right">Status</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Audio</td>
							<td class="has-text-right">
								<span class="tag is-small" class:is-success={debugInfo.producers.audio} class:is-light={!debugInfo.producers.audio}>
									{debugInfo.producers.audio ? "Active" : "None"}
								</span>
							</td>
						</tr>
						<tr>
							<td>Video</td>
							<td class="has-text-right">
								<span class="tag is-small" class:is-success={debugInfo.producers.video} class:is-light={!debugInfo.producers.video}>
									{debugInfo.producers.video ? "Active" : "None"}
								</span>
							</td>
						</tr>
					</tbody>
				</table>

				<hr class="my-2" />

				<table class="table is-fullwidth is-size-7">
					<thead>
						<tr>
							<th>Transmission</th>
							<th class="has-text-right">Status</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Audio TX</td>
							<td class="has-text-right">
								<span class="tag is-small" class:is-success={debugInfo.isTransmittingAudio} class:is-warning={!debugInfo.isTransmittingAudio}>
									{debugInfo.isTransmittingAudio ? "Sending" : "Not Sending"}
								</span>
							</td>
						</tr>
						<tr>
							<td>Video TX</td>
							<td class="has-text-right">
								<span class="tag is-small" class:is-success={debugInfo.isTransmittingVideo} class:is-warning={!debugInfo.isTransmittingVideo}>
									{debugInfo.isTransmittingVideo ? "Sending" : "Not Sending"}
								</span>
							</td>
						</tr>
						<tr>
							<td>Audio RX</td>
							<td class="has-text-right">
								<span class="tag is-small" class:is-success={mediaState.isReceivingAudio} class:is-warning={!mediaState.isReceivingAudio}>
									{mediaState.isReceivingAudio ? "Received" : "Not Received"}
								</span>
							</td>
						</tr>
						<tr>
							<td>Video RX</td>
							<td class="has-text-right">
								<span class="tag is-small" class:is-success={mediaState.isReceivingVideo} class:is-warning={!mediaState.isReceivingVideo}>
									{mediaState.isReceivingVideo ? "Received" : "Not Received"}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		{:else}
			<div class="box is-size-7 p-3">
				<p class="has-text-grey has-text-centered">Väntar på media status</p>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.debug-instrument {
		padding: 1rem 0;
	}

	.field {
		margin-bottom: 1.5rem;
	}

	.checkbox {
		display: flex;
		align-items: center;
		cursor: pointer;
	}

	.help {
		color: #757575;
	}

	.table {
		background-color: transparent;

		td,
		th {
			border: none;
			padding: 0.25rem 0.5rem;
		}

		thead th {
			font-weight: 600;
			color: #4a4a4a;
		}
	}

	.my-2 {
		margin-top: 0.5rem !important;
		margin-bottom: 0.5rem !important;
	}

	.p-3 {
		padding: 0.75rem !important;
	}

	.mb-3 {
		margin-bottom: 0.75rem !important;
	}

	hr {
		background-color: #f5f5f5;
	}
</style>
