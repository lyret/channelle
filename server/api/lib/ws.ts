import * as IO from 'socket.io';
import { http } from './http';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

let _io: IO.Server | undefined;

/** Returns the global web socket server  */
export function ws<
	EventsMap extends DefaultEventsMap = DefaultEventsMap,
>(): IO.Server<EventsMap> {
	// Return already initialized singelton instance
	if (_io) {
		return _io;
	}

	// Get the http server
	const _http = http();

	// Create and return the socket server
	_io = new IO.Server<EventsMap>(_http, {
		serveClient: false,
		path: CONFIG.socket.path,
	});

	return _io;
}
