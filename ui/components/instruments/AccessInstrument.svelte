<script lang="ts">
	import { onMount } from 'svelte';
	import { scenePassword } from '~/stores/access/scenePassword';

	let inputRef: HTMLInputElement;
	let inputValue: string = '';

	let isLoading = false;
	$: isLocked = !!$scenePassword.length;
	$: isChanged = $scenePassword != inputValue;
	$: disabled = isLoading || !isChanged;

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		isLoading = true;

		setTimeout(() => {
			isLoading = false;
			isChanged = false;
			scenePassword.set(inputValue);
		}, 1500);
		// await create('message', {
		// 	data: {
		// 		participantId: $currentParticipant.id,
		// 		backstage: makeBackstage,
		// 		message: inputValue,
		// 	},
		// });

		// loading = false;
		// inputValue = '';
	}

	onMount(() => {
		if (inputRef) {
			inputRef.focus();
		}
		const stop = scenePassword.subscribe((value) => {
			inputValue = value;
		});

		return () => {
			stop();
		};
	});
</script>

<h1 class="title mb-0">Tillgång</h1>
<p>Kontrollera vilka som har tillgång till scenen</p>
<h3 class="title is-4 mt-4 mb-0">Scenlösenord</h3>
<p>Ange ett lösenord som krävs för att komma in och se scenen.</p>
<form on:submit={onSubmit} class="form my-2">
	<div class="field has-addons">
		<div class="control is-expanded">
			<input
				type="text"
				bind:this={inputRef}
				class="input is-fullwidth is-medium"
				bind:value={inputValue}
				placeholder={isLocked
					? 'Spara för att ta bort lösenordet'
					: 'Ange ett lösenord'}
			/>
		</div>
		<div class="control">
			<button
				type="submit"
				class="button is-dark is-medium"
				{disabled}
				class:is-loading={isLoading}
				class:is-danger={isLocked && !isChanged && !isLoading}
				class:is-warning={isChanged || isLoading}
			>
				{#if isLocked}
					{#if isChanged && inputValue.length}
						<span class="icon"
							><ion-icon name="lock-closed-sharp"></ion-icon></span
						><span>Byt lösenord</span>
					{:else if isChanged}
						<span class="icon"
							><ion-icon name="lock-open-sharp"></ion-icon></span
						><span>Lås upp</span>
					{:else}
						<span class="icon"
							><ion-icon name="lock-closed-sharp"></ion-icon></span
						><span>Scenen är låst</span>
					{/if}
				{:else if isChanged}
					<span class="icon"
						><ion-icon name="lock-closed-sharp"></ion-icon></span
					><span>Lås nu</span>
				{:else}
					<span class="icon"><ion-icon name="lock-open-sharp"></ion-icon></span
					><span>Scenen är olåst</span>
				{/if}
			</button>
		</div>
	</div>
</form>
<p>Om du ändrar lösenordet måste alla ange det på nytt.</p>
