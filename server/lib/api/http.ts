import { restify } from "./restify";
import type { Server } from "http";

let _http: Server | undefined;

/** Returns the global node http server  */
export function http(): Server {
  // Return already initialized singelton instance
  if (_http) {
    return _http;
  }

  // Get the restify server
  const _app = restify();

  // Create and return the inner http server
  _http = _app.server;

  return _http;
}
