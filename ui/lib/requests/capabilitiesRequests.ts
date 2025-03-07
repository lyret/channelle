import type * as MediaSoup from "mediasoup-client";
import { createRtcRequest } from "../rtc";

/** Requests the servers real time protocol capabilities */
export const requestServerRTPCapabilities =
	createRtcRequest<MediaSoup.types.RtpCapabilities>("rtp-capabilities");
