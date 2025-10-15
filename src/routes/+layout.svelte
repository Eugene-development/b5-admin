<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeAuth, authState } from '$lib/state/auth.svelte.js';
	import { initializeDomainDetection } from '$lib/utils/domainAccess.svelte.js';
	import { browser } from '$app/environment';

	let { children, data } = $props();

	// Initialize authentication from server data first, then check with API
	$effect(() => {
		// If we have server data, update auth state immediately
		if (data?.user && data?.isAuthenticated) {
			console.log('🔄 Initializing auth from server data:', data.user);
			authState.user = data.user;
			authState.isAuthenticated = true;
			authState.emailVerified = data.user.email_verified || false;
			authState.initialized = true;
		}
		
		// Always initialize auth (will verify with API and set initialized flag)
		initializeAuth();
		initializeDomainDetection();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Show loading indicator while checking auth on initial load -->
{#if !authState.initialized && browser}
	<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
		<div class="text-center">
			<div class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
			<p class="text-gray-600 dark:text-gray-400">Загрузка...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen">
		{@render children?.()}
	</div>
{/if}
