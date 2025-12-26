<script>
	import { onMount, onDestroy } from 'svelte';
	
	let { children, target = 'body' } = $props();
	
	let portal = $state(null);
	let mounted = $state(false);
	
	onMount(() => {
		portal = document.createElement('div');
		portal.style.position = 'absolute';
		portal.style.top = '0';
		portal.style.left = '0';
		portal.style.width = '0';
		portal.style.height = '0';
		portal.style.overflow = 'visible';
		portal.style.zIndex = '9999';
		
		const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
		if (targetEl) {
			targetEl.appendChild(portal);
			mounted = true;
		}
	});
	
	onDestroy(() => {
		if (portal && portal.parentNode) {
			portal.parentNode.removeChild(portal);
		}
	});
</script>

{#if mounted && portal}
	<div bind:this={portal}>
		{@render children?.()}
	</div>
{/if}
