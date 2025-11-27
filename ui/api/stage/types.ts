/**
 * Type definitions for stage media streaming
 */
import type * as MediaSoup from "mediasoup-client";
import type { CustomAppData, MediaTag, TransportDirection, ActiveSpeaker, MediaSession } from "~/types/serverSideTypes";

// ============================================================================
// MEDIASOUP TYPE ALIASES
// ============================================================================

/** MediaSoup Transport with custom app data */
export type Transport = MediaSoup.types.Transport<CustomAppData>;

/** MediaSoup Consumer with custom app data */
export type Consumer = MediaSoup.types.Consumer<CustomAppData>;

/** MediaSoup Producer with custom app data */
export type Producer = MediaSoup.types.Producer<CustomAppData>;

/** MediaSoup Device type */
export type Device = MediaSoup.types.Device;

// ============================================================================
// RE-EXPORTS FROM SERVER TYPES
// ============================================================================

export type { CustomAppData, MediaTag, TransportDirection, ActiveSpeaker, MediaSession };

// ============================================================================
// STAGE CLIENT SPECIFIC TYPES
// ============================================================================

/** Result type for async operations */
export type AsyncResult<T = void> = Promise<{ success: true; data?: T } | { success: false; error: string }>;

/** Media stream configuration */
export interface MediaStreamConfig {
	video?: boolean | MediaStreamConstraints["video"];
	audio?: boolean | MediaStreamConstraints["audio"];
}

/** Transport creation options */
export interface TransportOptions {
	id: string;
	iceParameters: MediaSoup.types.IceParameters;
	iceCandidates: MediaSoup.types.IceCandidate[];
	dtlsParameters: MediaSoup.types.DtlsParameters;
	sctpParameters?: MediaSoup.types.SctpParameters;
}

/** Consumer parameters for subscribing to tracks */
export interface ConsumerParameters {
	mediaPeerId: string;
	mediaTag: MediaTag;
	producerId: string;
	id: string;
	kind: MediaSoup.types.MediaKind;
	rtpParameters: MediaSoup.types.RtpParameters;
	appData: CustomAppData;
}

/** Producer options for sending media */
export interface ProducerOptions {
	track: MediaStreamTrack;
	encodings?: MediaSoup.types.RtpEncodingParameters[];
	appData: CustomAppData;
}

/** Peer session information */
export interface PeerSession {
	peerId: string;
	hasMedia: boolean;
	videoAvailable: boolean;
	audioAvailable: boolean;
}

/** Debug state information */
export interface DebugState {
	consumers: Array<{
		id: string;
		peerId: string;
		mediaTag: MediaTag;
		paused: boolean;
		closed: boolean;
		trackState?: string;
		trackId?: string;
		transportId: string;
		connectionState?: string;
	}>;
	transports: Array<{
		peerId: string;
		transportId: string;
		connectionState: string;
		iceConnectionState: string;
		iceGatheringState: string;
		dtlsState: string;
		closed: boolean;
	}>;
	peers: Array<{
		peerId: string;
		online: boolean;
		name: string;
		videoMuted: boolean;
		audioMuted: boolean;
	}>;
	sessions: Array<{
		peerId: string;
		hasMedia: boolean;
		videoAvailable: boolean;
		audioAvailable: boolean;
	}>;
	sendTransport: {
		transportId: string;
		connectionState: string;
		iceConnectionState: string;
		iceGatheringState: string;
		dtlsState: string;
		closed: boolean;
	} | null;
}

/** Track statistics */
export interface TrackStats {
	total: number;
	paused: number;
	active: number;
	video: number;
	audio: number;
	byPeer: Record<string, { video: number; audio: number }>;
}
