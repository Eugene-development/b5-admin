<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeAuth, authState, updateAuthStateFromServer } from '$lib/state/auth.svelte.js';
	import { initializeDomainDetection } from '$lib/utils/domainAccess.svelte.js';
	import { browser } from '$app/environment';

	let { children, data } = $props();

	// Initialize domain detection (must be done before components that use it)
	if (browser) {
		initializeDomainDetection();
	}

	// Update auth state from server data first (this is synchronous and immediate)
	// This ensures auth state is available before any child components render
	$effect(() => {
		if (data) {
			updateAuthStateFromServer(data);
		}
	});

	// Then initialize from localStorage for additional data (async, background)
	// This runs after server data is already applied
	if (browser && !authState.initialized) {
		// Use queueMicrotask to ensure server data is processed first
		queueMicrotask(() => {
			if (!authState.initialized) {
				initializeAuth();
			}
		});
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Show loading indicator while checking auth on initial load -->
{#if !authState.initialized && browser}
	<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
			></div>
			<p class="text-gray-600 dark:text-gray-400">Загрузка...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen">
		{@render children?.()}
	</div>
{/if}
