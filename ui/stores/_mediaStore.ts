import { DeviceStatusName, MediaSubscription, MediaEvents } from '~/api';
import { readable } from 'svelte/store';

/** Store Interface */
interface APIStore {
  subscribe: (subscription: (value: StoreValue) => void) => () => void;
  publish: (vvv: 'camera' | 'screen') => void | Promise<void>;
  consume: () => void | Promise<void>;
}

/** Media Store Data Value */
type StoreValue = {
  /** Current media device status */
  deviceStatus: DeviceStatusName;
  /** Any local media stream */
  localMediaStream: MediaStream | undefined;
  /** Any remote media stream */
  remoteMediaStreams: Array<MediaStream>;
};

/** A svelte store for subscribing to - and otherwise accessing MediaSoup functionality */
export function createMediaStore(): APIStore {
  // Create the subscription
  const subscription = new MediaSubscription();

  // Create a readable store that returns the actual store value
  const { subscribe } = readable<StoreValue>(
    {
      deviceStatus: 'unknown',
      localMediaStream: undefined,
      remoteMediaStreams: [],
    },
    function start(_: any, update: any) {
      // Listen to status updates
      const statusHandler = (value: MediaEvents['deviceStatus']) => {
        update((prev: StoreValue) => ({
          ...prev,
          deviceStatus: value,
        }));
      };
      MediaSubscription.on('deviceStatus', statusHandler);

      // Listen to local media streams
      const localMediaHandler = (value: MediaEvents['localMediaStream']) => {
        update((prev: StoreValue) => ({
          ...prev,
          localMediaStream: value,
        }));
      };
      MediaSubscription.on('localMediaStream', localMediaHandler);
      // Listen to remote media streams
      const remoteMediaHandler = (value: MediaEvents['remoteMediaStreams']) => {
        update((prev: StoreValue) => ({
          ...prev,
          remoteMediaStreams: value,
        }));
      };
      MediaSubscription.on('remoteMediaStreams', remoteMediaHandler);

      /** On store disconnect */
      return function stop() {
        MediaSubscription.off('deviceStatus', statusHandler);
        MediaSubscription.off('localMediaStream', localMediaHandler);
        MediaSubscription.off('remoteMediaStreams', remoteMediaHandler);
      };
    }
  );

  // Return the store object
  return {
    /** Subscribe to the current API state */
    subscribe: subscribe,
    /** TODO: test */
    publish: async (vvv: 'camera' | 'screen') => {
      await subscription.publish(vvv);
    },
    /** TODO: test */
    consume: async () => {
      await subscription.consume();
    },
  };
}
