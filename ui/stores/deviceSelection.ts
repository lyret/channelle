import { persisted } from "svelte-persisted-store";

// Store for selected audio device ID (persisted across sessions)
const selectedAudioDeviceId = persisted<string>(`${CONFIG.runtime.slug}-selected-audio-device`, "");

// Store for selected video device ID (persisted across sessions)
const selectedVideoDeviceId = persisted<string>(`${CONFIG.runtime.slug}-selected-video-device`, "");

export { selectedAudioDeviceId, selectedVideoDeviceId };
