<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { initializeAuth } from '$lib/state/auth.svelte.js';

	let { children } = $props();

	// Global authentication initialization
	onMount(async () => {
		await initializeAuth();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<!-- Минимальный корневой layout без навигации -->
<div class="min-h-screen">
	{@render children?.()}
</div>
