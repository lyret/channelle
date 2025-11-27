<script lang="ts">
	import { debugModeStore } from "~/stores/debugMode";
</script>

<div class="debug-instrument">
	<h1 class="title mb-4">Diagnostik</h1>

	<div class="field">
		<label class="checkbox">
			<input type="checkbox" bind:checked={$debugModeStore} />
			<span class="ml-2">Visa debug-information över videos</span>
		</label>
		<p class="help is-size-7 mt-1">Visar diagnostikisk användbar information över video elementen på scenen</p>
	</div>

	<div class="field">
		<a class="button is-fullwidth is-small is-info" href="/debug" target="_blank">
			<span class="icon is-small">
				<i class="fas fa-external-link-alt"></i>
			</span>
			<span>Diagnosera ytterligare problem</span>
		</a>
		<p class="help is-size-7 mt-1">Öppnar /debug sidan i en ny flik</p>
	</div>
</div>

<style>
	.debug-instrument {
		padding: 1rem 0;
	}

	.field {
		margin-bottom: 1.5rem;
	}

	.checkbox {
		display: flex;
		align-items: center;
		cursor: pointer;
	}

	.help {
		color: #757575;
	}
</style>
