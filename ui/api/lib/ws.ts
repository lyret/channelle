import { Manager, type Socket } from 'socket.io-client';

/** A global socket manager to keep configuraiton similar between all namespaces */
const { url, path, transports } = CONFIG.socket;
const _manager: Manager = new Manager(url, {
	path,
	transports,
});

/** Registry of all created sockets, per namespace */
let _sockets: Map<string, Socket> = new Map();

/** Returns the global web socket client for the given namespace, or fallback to the main one */
export function ws(namespace: string = ''): Socket {
	return _manager.socket(namespace);
}
