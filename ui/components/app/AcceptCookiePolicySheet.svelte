<script lang="ts">
	import { cookiesAllowed } from "~/stores/cookiesAllowed";
	
	// Event handlers

	const onCookiesAllowed = () => {
		cookiesAllowed.set(true);
	}

</script>

<div class="header is-family-primary has-text-centered is-size-4 mb-3">
	Tillåter du webbkakor? 🍪
</div>

<p class="mb-4">
	Bokninsystemet använder webbkakor för att spara din kundinformation mellan beställningar.
	Informationen är privat för dig och endast information som behövs för att lägga din beställning
	sparas.
</p>

<button class="button is-primary is-rounded is-fullwidth" on:click={onCookiesAllowed}>
	Påbörja din bokning
</button>