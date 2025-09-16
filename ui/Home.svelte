<script lang="ts">
	import Wrapper from "./components/wrapper/Wrapper.svelte";
	import HomePage from "~/pages/Home.svelte";
</script>

<Wrapper lockedToManager={false} lockedToInviteKey={false} hasInteractedWithTheDocument={true}>
	<HomePage />
</Wrapper>
