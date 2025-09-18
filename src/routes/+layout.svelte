<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeAuth } from '$lib/state/auth.svelte.js';
	import { initializeDomainDetection } from '$lib/utils/domainAccess.svelte.js';

	let { children, data } = $props();

	// Initialize authentication and domain detection when the app starts
	$effect(() => {
		initializeAuth();
		initializeDomainDetection();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen">
	{@render children?.()}
</div>
