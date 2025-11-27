/**
 * Debug utilities for stage media streaming
 */
import { get } from "svelte/store";
import { consumersStore, recvTransports, sendTransportStore, sessionsStore } from "./stores";
import { showPeersStore } from "../backstage";

/**
 * Get comprehensive debug state for the media room
 * @returns Object containing detailed state of consumers, transports, peers, and sessions
 */
export function getDebugState() {
	const consumers = get(consumersStore);
	const transports = get(recvTransports);
	const peers = get(showPeersStore);
	const sessions = get(sessionsStore);

	return {
		consumers: consumers.map((c) => ({
			id: c.id,
			peerId: c.appData.peerId,
			mediaTag: c.appData.mediaTag,
			paused: c.paused,
			closed: c.closed,
			trackState: c.track?.readyState,
			trackId: c.track?.id,
			transportId: c.producerId,
			connectionState: transports[c.appData.peerId]?.connectionState,
		})),
		transports: Object.entries(transports).map(([peerId, transport]) => ({
			peerId,
			transportId: transport.id,
			connectionState: transport.connectionState,
			iceConnectionState: transport.iceConnectionState,
			iceGatheringState: transport.iceGatheringState,
			dtlsState: transport.dtlsState,
			closed: transport.closed,
		})),
		peers: Object.entries(peers).map(([peerId, peer]) => ({
			peerId,
			online: peer.online,
			name: peer.name,
			videoMuted: peer.videoMuted,
			audioMuted: peer.audioMuted,
		})),
		sessions: Object.entries(sessions).map(([peerId, session]) => ({
			peerId,
			hasMedia: session.hasMedia,
			videoAvailable: session.videoAvailable,
			audioAvailable: session.audioAvailable,
		})),
		sendTransport: get(sendTransportStore)
			? {
					transportId: get(sendTransportStore)?.id,
					connectionState: get(sendTransportStore)?.connectionState,
					iceConnectionState: get(sendTransportStore)?.iceConnectionState,
					iceGatheringState: get(sendTransportStore)?.iceGatheringState,
					dtlsState: get(sendTransportStore)?.dtlsState,
					closed: get(sendTransportStore)?.closed,
			  }
			: null,
	};
}

/**
 * Log the current debug state to the console
 * @param context - Context string to identify the log
 */
export function logDebugState(context = "DEBUG") {
	const state = getDebugState();
	console.group(`[${context}] Media Room State`);
	console.log("Consumers:", state.consumers);
	console.log("Receive Transports:", state.transports);
	console.log("Send Transport:", state.sendTransport);
	console.log("Peers:", state.peers);
	console.log("Sessions:", state.sessions);
	console.groupEnd();
}

/**
 * Get statistics about current media tracks
 * @returns Object with track statistics
 */
export function getTrackStats() {
	const consumers = get(consumersStore);
	const total = consumers.length;
	const paused = consumers.filter((c) => c.paused).length;
	const active = consumers.filter((c) => !c.paused && !c.closed).length;
	const video = consumers.filter((c) => c.appData.mediaTag === "video").length;
	const audio = consumers.filter((c) => c.appData.mediaTag === "audio").length;

	return {
		total,
		paused,
		active,
		video,
		audio,
		byPeer: consumers.reduce((acc, c) => {
			const peerId = c.appData.peerId;
			if (!acc[peerId]) acc[peerId] = { video: 0, audio: 0 };
			acc[peerId][c.appData.mediaTag]++;
			return acc;
		}, {} as Record<string, { video: number; audio: number }>),
	};
}
