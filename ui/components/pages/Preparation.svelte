<script lang="ts">
	import { blur } from "svelte/transition";
	import { openInstruments } from "~/stores/instruments";

	import Wrapper from "./_Wrapper.svelte";
	import AccessInstrument from "~/components/instruments/AccessInstrument.svelte";
	import ChatInstrument from "~/components/instruments/ChatInstrument.svelte";
	import MediaLibraryInstrument from "~/components/instruments/MediaLibraryInstrument.svelte";
	import ParticipantsInstrument from "~/components/instruments/ParticipantsInstrument.svelte";
	import SceneSelectorInstrument from "~/components/instruments/SceneSelectorInstrument.svelte";

	import IconCheckCircle from "~/components/icons/Icon-check-circle.svelte";
	import IconCircle from "~/components/icons/Icon-circle.svelte";
	import IconKey from "~/components/icons/Icon-key.svelte";
	import IconLayers from "~/components/icons/Icon-layers.svelte";
	import IconMessageCircle from "~/components/icons/Icon-message-circle.svelte";
	import IconUsers from "~/components/icons/Icon-users.svelte";

	import logoSrc from "~/assets/images/redrose.gif";
</script>

<Wrapper lockedToManager={true}>
	<main in:blur={{ delay: 500, duration: 1000 }}>
		<!-- Header -->
		<div class="image-container has-text-centered header" style="height:100px" in:blur={{ duration: 5000, delay: 2000 }}>
			<img src={logoSrc} alt="logotyp" class="mt-3 mb-0" style="height:80px" />
		</div>
		<div class="has-text-centered mb-4" in:blur={{ duration: 500, delay: 1000 }}>
			<h1 class="title is-4 has-text-white">Förberedelser</h1>
			<p class="subtitle is-6 has-text-grey">Konfigurera scenen innan lansering</p>
		</div>
		<div class="tabs is-light is-boxed is-centered mb-0" in:blur={{ duration: 100 }}>
			<ul>
				<li class:is-active={$openInstruments["scene-settings"]}>
					<a on:click={() => openInstruments.toggle("scene-settings")}
						><span class="icon"><IconLayers /></span> Scenen
						<span class="icon">
							{#if $openInstruments["scene-settings"]}
								<IconCheckCircle />
							{:else}
								<IconCircle />
							{/if}
						</span></a
					>
				</li>
				<li class:is-active={$openInstruments["participants"]}>
					<a on:click={() => openInstruments.toggle("participants")}
						><span class="icon"><IconUsers /></span>
						Deltagare
						<span class="icon">
							{#if $openInstruments["participants"]}
								<IconCheckCircle />
							{:else}
								<IconCircle />
							{/if}
						</span></a
					>
				</li>
				<li class:is-active={$openInstruments["chat"]}>
					<a on:click={() => openInstruments.toggle("chat")}
						><span class="icon"><IconMessageCircle /></span>
						Chatt<span class="icon"
							>{#if $openInstruments["chat"]}
								<IconCheckCircle />
							{:else}
								<IconCircle />
							{/if}</span
						></a
					>
				</li>
				<li class:is-active={$openInstruments["access"]}>
					<a on:click={() => openInstruments.toggle("access")}
						><span class="icon"><IconKey /></span>
						Tillgång<span class="icon"
							>{#if $openInstruments["access"]}
								<IconCheckCircle />
							{:else}
								<IconCircle />
							{/if}</span
						></a
					>
				</li>
				<!-- <li class:is-active={$openInstruments['media-library']}>
				<a on:click={() => openInstruments.toggle('media-library')}
					><span class="icon"><IconImage/></span>
					Mediabibliotek<span class="icon"
						>{#if $openInstruments['media-library']}
							<IconCheckCircle />
						{:else}
							<IconCircle />
						{/if}</span
					></a
				>
			</li> -->
			</ul>
		</div>
		<!-- Content -->
		<div in:blur={{ delay: 0, duration: 1000 }} class={`instruments instrument-cols-${Object.values($openInstruments).length}`}>
			{#if $openInstruments["scene-settings"]}
				<div class="instrument">
					<SceneSelectorInstrument />
				</div>
			{/if}
			{#if $openInstruments["participants"]}
				<div class="instrument">
					<ParticipantsInstrument />
				</div>
			{/if}
			{#if $openInstruments["chat"]}
				<div class="instrument">
					<ChatInstrument />
				</div>
			{/if}
			{#if $openInstruments["access"]}
				<div class="instrument">
					<AccessInstrument />
				</div>
			{/if}
			{#if $openInstruments["media-library"]}
				<div class="instrument">
					<MediaLibraryInstrument />
				</div>
			{/if}
		</div>
	</main>
</Wrapper>

<style>
	main {
		background-color: var(--channelle-main-bg-color);
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.instruments,
	.instrument {
		background-color: var(--channelle-backstage-bg-color);
	}
	.instrument-cols-0 {
		background-color: var(--channelle-main-bg-color);
		height: 0;
		flex-grow: 0;
	}

	li a {
		color: var(--channelle-main-text-color);
	}
	li:hover a,
	li.is-active a {
		border-color: var(--channelle-backstage-text-color);
		color: var(--channelle-backstage-text-color);
		background-color: var(--channelle-backstage-bg-color);
	}
	.tabs ul {
		border-color: var(--channelle-backstage-text-color);
		border-bottom: none;
	}

	.header,
	.tabs {
		background-color: var(--channelle-main-bg-color);
		padding: 0;
		display: block;
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 1;
	}

	.tabs {
		z-index: 10;
		/* box-shadow: 0px 20px 10px rgb(20, 22, 26); */
	}

	.instruments {
		flex-grow: 1;
		display: flex;
		flex-direction: row;
		overflow: hidden;
	}

	.instrument-cols-1 {
		margin-left: 20%;
		margin-right: 20%;
	}
	.instrument-cols-2 {
		margin-left: 10%;
		margin-right: 10%;
	}
	.instrument-cols-3 {
		margin-left: 5%;
		margin-right: 5%;
	}

	.instrument {
		flex: 1; /* Ensure they shrink/grow evenly */
		margin: 10px;
		padding: 10px;
		padding-top: 20px;
		padding-bottom: 20px;
		overflow-y: auto; /* Makes each pane scrollable */
	}
</style>
