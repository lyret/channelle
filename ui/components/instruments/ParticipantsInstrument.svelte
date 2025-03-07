<script lang="ts">
	import { createDatabaseStore } from "~/stores";
	import { onlineStatus } from "~/stores/users";
	import ParticipantsControl from "./ParticipantsControl.svelte";

	const participants = createDatabaseStore("participant");
	$: participantsWithName = $participants.filter((p) => p.name && !p.blocked);
	$: managers = participantsWithName.filter((p) => p.manager);
	$: actors = participantsWithName.filter((p) => p.actor && !p.manager);
	$: visitors = participantsWithName.filter(
		(p) => !p.manager && !p.actor && !p.blocked
	);
	$: blocked = $participants.filter((p) => p.blocked && p.name);
	$: online =
		$onlineStatus && participantsWithName.filter((p) => $onlineStatus[p.id]);

	let filter: string = "Deltagare";
</script>

<div class="radios is-size-7">
	<label class="radio">
		<input type="radio" name="filter" value="Deltagare" bind:group={filter} />
		Alla
	</label>
	{#if managers.length}
		<label class="radio has-text-link">
			<input type="radio" name="filter" value="Tekniker" bind:group={filter} />
			Tekniker
		</label>
	{/if}
	{#if actors.length}
		<label class="radio has-text-link">
			<input
				type="radio"
				name="filter"
				bind:group={filter}
				value="Skådespelare"
			/>
			Skådespelare
		</label>
	{/if}
	<label class="radio has-text-success">
		<input
			type="radio"
			name="filter"
			value="Deltagare online"
			bind:group={filter}
		/>
		Online
	</label>
	{#if blocked.length}
		<label class="radio has-text-danger">
			<input
				type="radio"
				name="filter"
				value="Blockerade deltagare"
				bind:group={filter}
			/>
			Blockerade
		</label>
	{/if}
</div>

<h1
	class="title is-size-3 mt-5"
	class:has-text-info={filter == "Tekniker" || filter == "Skådespelare"}
	class:has-text-success={filter == "Deltagare online"}
	class:has-text-danger={filter == "Blockerade deltagare"}
>
	{filter}
</h1>

<div class="list">
	{#if blocked.length && filter == "Blockerade deltagare"}
		{#each blocked as participant}
			{#key participant.id}
				<ParticipantsControl
					{participant}
					online={$onlineStatus[participant.id]}
				/>
			{/key}
		{/each}
	{:else if online.length && filter == "Deltagare online"}
		{#each online as participant}
			{#key participant.id}
				<ParticipantsControl
					{participant}
					online={$onlineStatus[participant.id]}
				/>
			{/key}
		{/each}
	{:else}
		{#if managers.length && (filter == "Deltagare" || filter == "Tekniker")}
			{#each managers as participant}
				{#key participant.id}
					<ParticipantsControl
						{participant}
						online={$onlineStatus[participant.id]}
					/>
				{/key}
			{/each}
		{/if}
		{#if actors.length && (filter == "Deltagare" || filter == "Skådespelare")}
			{#each actors as participant}
				{#key participant.id}
					<ParticipantsControl
						{participant}
						online={$onlineStatus[participant.id]}
					/>
				{/key}
			{/each}
		{/if}
		{#if visitors.length && filter != "Tekniker" && filter != "Skådespelare"}
			{#each visitors as participant}
				{#key participant.id}
					{#key participant.id}
						<ParticipantsControl
							{participant}
							online={$onlineStatus[participant.id]}
						/>
					{/key}
				{/key}
			{/each}
		{/if}
	{/if}
</div>
