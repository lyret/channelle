import * as MediaSoup from 'mediasoup-client';

/** Global MediaSoup Device object for the client */
let _mediaDevice: MediaSoup.Device | undefined = undefined;

/** Returns the global local media soup device for the client and initializes it if needed */
export function mediaDevice(): MediaSoup.Device {
	// Return already existing device
	if (_mediaDevice) {
		return _mediaDevice;
	}

	// Check necessary capabilities of the browser
	try {
		// Browser media display is not supportered
		if (typeof navigator.mediaDevices.getDisplayMedia === 'undefined') {
			throw new Error('On this device Display Media is not supported');
		}
		if (!mediaDevice().canProduce('video')) {
			throw new Error('This device cannot produce video');
		}
	} catch (err: any) {
		// Unsupported due to error
		if (err.name === 'UnsupportedError') {
			throw new Error('Browser is unsupported due to an error thrown');
		}
	}

	_mediaDevice = new MediaSoup.Device();
	return _mediaDevice;
}
