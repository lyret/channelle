/** Returns a media stream of the given type from the client device */

export async function getDeviceMediaStream(
	type: 'camera' | 'screen' | 'audio'
) {
	try {
		if (type == 'audio') {
			return await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
		}
		if (type == 'camera') {
			return await navigator.mediaDevices.getUserMedia({
				video: true,
			});
		}
		if (type == 'screen') {
			return await navigator.mediaDevices.getDisplayMedia({
				video: true,
			});
		}
		throw new Error(
			'Unknown type of local media stream requested from the device'
		);
	} catch (err) {
		console.error('Failed to get a local media stream of the type ' + type);
		console.error(err);
		throw err;
	}
}
