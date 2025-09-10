<script lang="ts">
	import { blur } from "svelte/transition";
	import { ConsumedMediaStore } from "~/lib/stores/consumedMedia";
	import { StageAudio } from "~/lib/stores/stageAudio";
	import { StageLayout } from "~/lib/stores/stageLayout";
	import { userCameraBans, userMicrophoneBans } from "~/stores/users";
	import { currentParticipant } from "../lib/stores/api";

	import { roomClient } from "../room/room-client";

	let countOfStageAudio = 0;
	StageAudio.subscribe(() => countOfStageAudio++);
	let countOfStageLayout = 0;
	StageLayout.subscribe(() => countOfStageLayout++);
</script>

<main in:blur={{ delay: 500, duration: 1000 }}>
	<h1>CurrentParticipant</h1>
	{JSON.stringify($currentParticipant)}
	<h1>Camera Bans</h1>
	{JSON.stringify($userCameraBans)}
	<h1>Microphone Bans</h1>
	{JSON.stringify($userMicrophoneBans)}
	<h1>Stage Layout ({countOfStageLayout})</h1>
	{JSON.stringify($StageLayout)}
	<h1>Stage Audio ({countOfStageLayout})</h1>
	{JSON.stringify($StageAudio)}
	<h1>Stage Audio ({countOfStageLayout})</h1>
	{JSON.stringify($ConsumedMediaStore)}
</main>

<style>
	main {
		padding-left: 50px;
	}
</style>
