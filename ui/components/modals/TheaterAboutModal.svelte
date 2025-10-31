<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import Modal from "./_Modal.svelte";

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	export let isVisible = false;

	function handleClose() {
		dispatch("close");
	}
</script>

<Modal {isVisible} title="Om den här sidan..." size="medium" on:close={handleClose}>
	<div class="content">
		<p>
			<b>Channelle</b> är en multimediaapplikation för onlineteaterföreställningar. Detta är "teater"-sidan - ett administrativt verktyg för att skapa och
			hantera föreställningarna och skapa scener. Varje scen körs på en egen server och bör bara vara aktiva under tiden föreställningen visas för publik.
		</p>

		<h5 class="title is-6">Vad kan du göra här?</h5>
		<ul>
			<li><strong>Skapa nya föreställningar:</strong> Logga in för att skapa nya föreställningar och lansera dem på scen</li>
			<li>
				<strong>Hantera föreställningar:</strong> Konfigurera inställningar, scener och manus för dina föreställningar innan du startar en dyr server
			</li>
		</ul>

		<div class="notification is-secondary has-text-black is-light mt-4">
			<p class="has-text-weight-semibold">Teknik</p>
			<p class="has-text-black">
				Byggd med moderna webbteknologier inkluderande Svelte, WebRTC via MediaSoup, och TypeScript för en robust och skalbar teaterupplevelse. Se och
				hämta koden från <a class="has-text-black" href="https://codeberg.org/lyret/channelle">Codeberg</a>.
			</p>
			<p class="is-size-7 mt-2">Licens: Creative Commons BY-NC 4.0 (icke-kommersiell användning)</p>
		</div>
	</div>

	<svelte:fragment slot="footer">
		<button class="button" on:click={handleClose}>Stäng</button>
	</svelte:fragment>
</Modal>

<style lang="scss">
	.content {
		h4,
		h5 {
			margin-bottom: 0.75rem;
		}

		ul {
			margin-left: 1.5rem;

			li {
				margin-bottom: 0.5rem;
			}
		}

		p {
			margin-bottom: 1rem;
			line-height: 1.6;
		}
	}
</style>
