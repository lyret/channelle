import { Manager } from 'socket.io-client';

/** A global socket manager to keep configuraiton similar between all namespaces */
const { url, path, transports } = CONFIG.socket;
const _manager: SocketIOClient.Manager = new Manager(url, {
	path,
	transports,
});

/** Registry of all created sockets, per namespace */
let _sockets: Map<string, SocketIOClient.Socket> = new Map();

/** Returns the global web socket client for the given namespace, or fallback to the main one */
export function ws(namespace: string = ''): SocketIOClient.Socket {
	return _manager.socket(namespace);
}
