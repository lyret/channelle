<script lang="ts">
	import { blur } from "svelte/transition";
	import { openInstruments } from "~/stores/ui";
	import logoSrc from "../assets/images/redrose.gif";
	import ChatList from "~/components/instruments/ChatInstrument.svelte";
	import ParticipantsInstrument from "~/components/instruments/ParticipantsInstrument.svelte";
	import SceneSelectorInstrument from "~/components/instruments/SceneSelectorInstrument.svelte";
	import MediaLibraryInstrument from "~/components/instruments/MediaLibraryInstrument.svelte";
	import IconUsers from "~/components/icons/Icon-users.svelte";
	import AccessInstrument from "~/components/instruments/AccessInstrument.svelte";
	import IconLayers from "~/components/icons/Icon-layers.svelte";
	import IconMessageCircle from "~/components/icons/Icon-message-circle.svelte";
	import IconCheckCircle from "~/components/icons/Icon-check-circle.svelte";
	import IconCircle from "~/components/icons/Icon-circle.svelte";
	import IconKey from "~/components/icons/Icon-key.svelte";
</script>

<main in:blur={{ delay: 500, duration: 1000 }}>
	<!-- Header -->
	<div
		class="image-container has-text-centered header"
		style="height:100px"
		in:blur={{ duration: 5000, delay: 2000 }}
	>
		<img src={logoSrc} alt="logotyp" class="mt-3 mb-0" style="height:80px" />
	</div>
	<div
		class="tabs is-light is-boxed is-centered mb-0"
		in:blur={{ duration: 100 }}
	>
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
	<div
		in:blur={{ delay: 0, duration: 1000 }}
		class={`instruments instrument-cols-${Object.values($openInstruments).length}`}
	>
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
				<ChatList />
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
	<div class="footer"></div>
</main>

<style>
	main {
		background-color: rgb(30, 30, 30);
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.instruments,
	.instrument {
		background-color: rgb(20, 22, 26);
	}

	.header,
	.tabs,
	.footer {
		background-color: rgb(30, 30, 30);
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

	.footer {
		border-top: 1px solid var(--bulma-border);
		z-index: 10;
		box-shadow: 0px -10px 10px rgb(30, 30, 30);
		width: 100vw;
		overflow: hidden;
		-webkit-font-smoothing: antialiased;
	}
	.footer span {
		display: block;
		width: auto;
		padding-bottom: 20px;
		white-space: nowrap;
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
