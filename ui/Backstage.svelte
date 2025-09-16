<script lang="ts">
	import Wrapper from "./components/wrapper/Wrapper.svelte";
	import BackstagePage from "~/pages/Backstage.svelte";
</script>

<Wrapper lockedToManager={true}>
	<BackstagePage />
</Wrapper>
