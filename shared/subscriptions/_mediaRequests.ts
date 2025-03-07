import type * as MediaSoup from "mediasoup-client";
import type { DataTypes } from "~/lib/_databaseTypes";

/**
 * Possible requests and returned data available through the socket connection
 * requestType: [parameterData, returnedData]
 */
export type MediaRequests = {
	effects_trigger: [undefined, Record<string, number>];
	effects_add: [{ type: string; number: number }, undefined];
	remove_consumer: [{}, boolean];
	transport_receiver_connect: [
		{ transportId: string; dtlsParameters: MediaSoup.types.DtlsParameters },
		undefined,
	];
	transport_receiver_consume: [undefined, undefined];
	transport_receiver_resume: [undefined, undefined];
};
