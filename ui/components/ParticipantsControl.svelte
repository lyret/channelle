<script lang="ts">
	import { update, DataTypes } from "~/api";
	import { clickOutside } from "~/directives";
	
	export let participant : DataTypes['participant'];
	let loading: boolean = false
	let dropdownActive: boolean = false
	
	async function doUpdate(participant : DataTypes['participant'], data: Partial<DataTypes['participant']>, ask?: string) {
		loading = true;
		if (!ask || confirm(ask)) {
			await update("participant", { where: { id: participant.id }, data  });
		}
		loading = false
	}
</script>

<div class="dropdown"  class:is-active={dropdownActive} use:clickOutside on:click_outside={() => dropdownActive = false}>
  <div class="dropdown-trigger">
	<button class="button" aria-haspopup="true" aria-controls="dropdown-menu" on:click={() => dropdownActive = true} class:is-loading={loading}>
	  {#if participant.online}
		  🟢
	  {:else}
		  🔴
	  {/if}
	  <span class="pr-7" class:is-strikethrough={participant.blocked}>{participant.name}</span>
	</button>
  </div>
  <div class="dropdown-menu">
	<div class="dropdown-content">
	  {#if participant.blocked}
	  <a class="dropdown-item" on:click={() => doUpdate(participant, { blocked: false })}>
			  <span class="icon"><ion-icon name="lock-open"></ion-icon></span> Allow in
	  </a>
	  {:else}
	  <a class="dropdown-item" on:click={() => doUpdate(participant, { blocked: true }, `Do you want to remove and block the user "${participant.name}"?`)}>
			  <span class="icon"><ion-icon name="lock-closed"></ion-icon></span> Block person
	  </a>
	  {/if}
	</div>
  </div>
</div>