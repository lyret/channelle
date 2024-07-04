<script lang="ts">
	import { currentParticipant } from '~/stores/connection';
	import { blur } from 'svelte/transition';
	import { openPanels, togglePanel } from '~/stores/ui';
	import imgSrc from '../../assets/images/plum.png';
</script>

<div
	class="image-container has-text-centered"
	style="height:120px"
	in:blur={{ duration: 500 }}
>
	<img src={imgSrc} alt="logotyp" style="height:80px" />
	<p>{$currentParticipant.name}</p>
</div>
<div class="tabs is-centered" in:blur={{ duration: 700 }}>
	<ul>
		<li>
			<span class="is-plants has-text-centered is-size-4 is-hidden-touch"
				>s t i n a o c h v i k</span
			>
		</li>
		<!-- <li class:is-active={$openPanels['live']}>
			<a on:click={() => togglePanel('live')}
				><span class="icon"><ion-icon name="play"></ion-icon></span> Live
				<span class="icon"
					><ion-icon
						name={$openPanels['live']
							? 'checkmark-circle-outline'
							: 'ellipse-outline'}
					></ion-icon></span
				>
			</a>
		</li> -->
		<li class:is-active={$openPanels['scenes']}>
			<a on:click={() => togglePanel('scenes')}
				><span class="icon"><ion-icon name="albums"></ion-icon></span> Scenen
				<span class="icon"
					><ion-icon
						name={$openPanels['scenes']
							? 'checkmark-circle-outline'
							: 'ellipse-outline'}
					></ion-icon></span
				></a
			>
		</li>
		<li class:is-active={$openPanels['participants']}>
			<a on:click={() => togglePanel('participants')}
				><span class="icon"><ion-icon name="accessibility"></ion-icon></span>
				Deltagare
				<span class="icon"
					><ion-icon
						name={$openPanels['participants']
							? 'checkmark-circle-outline'
							: 'ellipse-outline'}
					></ion-icon></span
				></a
			>
		</li>
		<li class:is-active={$openPanels['chatt']}>
			<a on:click={() => togglePanel('chatt')}
				><span class="icon"><ion-icon name="chatbox-ellipses"></ion-icon></span>
				Chatt<span class="icon"
					><ion-icon
						name={$openPanels['chatt']
							? 'checkmark-circle-outline'
							: 'ellipse-outline'}
					></ion-icon></span
				></a
			>
		</li>
		<li>
			<span class="is-plants has-text-centered is-size-4 is-hidden-touch"
				>t o r o c h e b b a</span
			>
		</li>
	</ul>
</div>
