/**
 * Interface for peer media information
 */
export interface PeerMedia {
  paused: boolean;
  encodings: any[];
}

/**
 * Interface for producer statistics
 */
export interface ProducerStats {
  [producerId: string]: any;
}

/**
 * Interface for consumer statistics
 */
export interface ConsumerStats {
  [consumerId: string]: any;
}

/**
 * Interface for consumer layer information
 */
export interface ConsumerLayer {
  currentLayer: number;
  clientSelectedLayer: number;
}

/**
 * Interface for peer statistics
 */
export interface PeerStats {
  producers: ProducerStats;
  consumers: ConsumerStats;
}

/**
 * Interface for peer information
 */
export interface Peer {
  joinTs: number;
  lastSeenTs: number;
  media: {
    [mediaTag: string]: PeerMedia;
  };
  stats: PeerStats;
  consumerLayers: {
    [consumerId: string]: ConsumerLayer;
  };
}

/**
 * Interface for active speaker information
 */
export interface ActiveSpeaker {
  producerId: string | null;
  volume: number | null;
  peerId: string | null;
}

/**
 * Interface for the room state
 */
export interface RoomState {
  // External - information exposed to clients
  peers: {
    [peerId: string]: Peer;
  };
  activeSpeaker: ActiveSpeaker;

  // Internal - server-side tracking
  transports: {
    [transportId: string]: any;
  };
  producers: {
    id: string;
    kind: string;
    peerId: string;
    mediaTag: string;
    paused: boolean;
    appData: any;
  }[];
  consumers: {
    id: string;
    kind: string;
    peerId: string;
    producerId: string;
    mediaTag: string;
    paused: boolean;
    appData: any;
  }[];
}

export const roomState: RoomState = {
  // external
  peers: {},
  activeSpeaker: { producerId: null, volume: null, peerId: null },
  // internal
  transports: {},
  producers: [] as RoomState["producers"],
  consumers: [] as RoomState["consumers"],
};

/**
 * Room State Structure
 *
 * For each peer that connects, we keep a table of peers and what
 * tracks are being sent and received. We also need to know the last
 * time we saw the peer, so that we can disconnect clients that have
 * network issues.
 *
 * Each client polls the server at 1Hz, and we send the roomState.peers
 * data structure as our answer to each poll request.
 *
 * Peer structure:
 * {
 *   joinTs: <ms timestamp>,
 *   lastSeenTs: <ms timestamp>,
 *   media: {
 *     [mediaTag]: {
 *       paused: <boolean>,
 *       encodings: []
 *     }
 *   },
 *   stats: {
 *     producers: {
 *       [producerId]: {
 *         // selected producer stats
 *       }
 *     },
 *     consumers: {
 *       [consumerId]: {
 *         // selected consumer stats
 *       }
 *     }
 *   },
 *   consumerLayers: {
 *     [consumerId]: {
 *       currentLayer: <number>,
 *       clientSelectedLayer: <number>
 *     }
 *   }
 * }
 *
 * We also send information about the active speaker, as tracked by
 * our audioLevelObserver.
 *
 * Internally, we keep lists of transports, producers, and
 * consumers. Whenever we create a transport, producer, or consumer,
 * we save the remote peerId in the object's `appData`. For producers
 * and consumers, we also keep track of the client-side "media tag" to
 * correlate tracks.
 */
