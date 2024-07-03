<script lang="ts">
	import { create } from '~/api';
	import { currentParticipant } from '~/stores/connection';
	export let makeBackstage: boolean = false;
	let inputValue: string = '';
	let loading = false;
	$: disabled = loading || !inputValue.length;

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;

		await create('message', {
			data: {
				participantId: $currentParticipant.id,
				backstage: makeBackstage,
				message: inputValue,
			},
		});

		loading = false;
		inputValue = '';
	}
</script>

<form on:submit={onSubmit} class="form">
	<div class="field has-addons">
		<div class="control is-expanded">
			<input
				type="text"
				class="input is-rounded is-fullwidth"
				bind:value={inputValue}
				placeholder="..."
			/>
		</div>
		<div class="control">
			<button
				type="submit"
				class="button is-dark is-rounded"
				{disabled}
				class:is-loading={loading}
				class:is-success={!loading && !disabled && !makeBackstage}
				class:is-info={!loading && !disabled && makeBackstage}
			>
				{#if disabled}
					<span class="icon"><ion-icon name="arrow-back"></ion-icon></span><span
						>Skriv något</span
					>
				{:else if makeBackstage}
					<span class="icon"><ion-icon name="arrow-up"></ion-icon></span><span
						>Skicka till backstage</span
					>
				{:else}
					<span class="icon"><ion-icon name="arrow-up"></ion-icon></span><span
						>Skicka till alla</span
					>
				{/if}
			</button>
		</div>
	</div>
</form>
