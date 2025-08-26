<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { initializeAuth } from '$lib/state/auth.svelte.js';

	let { children } = $props();

	// Global authentication initialization
	onMount(async () => {
		console.log('Root layout onMount - starting');
		console.log('Root layout onMount - calling initializeAuth');
		try {
			await initializeAuth();
			console.log('Root layout onMount - initializeAuth completed successfully');
		} catch (error) {
			console.error('Root layout onMount - initializeAuth failed:', error);
		}
		console.log('Root layout onMount - completed');
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
