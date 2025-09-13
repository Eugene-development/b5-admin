<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initAuthFromServer } from '$lib/auth/auth.svelte.js';

	let { children, data } = $props();

	// Initialize authentication from server data
	// This avoids the fetch warning by using server-side data
	$effect(() => {
		if (data) {
			initAuthFromServer(data);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Render children directly since auth is initialized from server -->
{@render children?.()}
