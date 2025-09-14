<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeAuth } from '$lib/state/auth.svelte.js';

	let { children, data } = $props();

	// Initialize authentication when the app starts
	$effect(() => {
		initializeAuth();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen">
	{@render children?.()}
</div>
