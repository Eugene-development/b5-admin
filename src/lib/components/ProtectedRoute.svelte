<!--
  ProtectedRoute Component for B5-Admin
  
  Protects administrative pages from unauthorized access by checking:
  - User authentication status
  - Email verification status (if required)
  - Automatically redirects to login page with redirectTo parameter
  
  Props:
  - requireEmailVerification: boolean (default: false) - Whether to require email verification
  - redirectTo: string (optional) - Custom redirect URL after login
  - children: snippet - Content to render when access is granted
-->

<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		authState,
		initializeAuth,
		isAuthenticated,
		isEmailVerified,
		isLoading
	} from '../state/auth.svelte.js';
	import LoadingSpinner from './LoadingSpinner.svelte';

	// Props
	let { requireEmailVerification = false, redirectTo = undefined, children } = $props();

	// State to prevent flickering during initialization
	let isInitializing = $state(true);

	// Reactive state for access control
	let hasAccess = $derived(() => {
		// If still loading or not initialized, don't grant access yet
		if (!authState.initialized || isLoading() || isInitializing) {
			return false;
		}

		// Check authentication
		if (!isAuthenticated()) {
			return false;
		}

		// Check email verification if required
		if (requireEmailVerification && !isEmailVerified()) {
			return false;
		}

		return true;
	});

	// Reactive state for determining redirect behavior
	let shouldRedirect = $derived(() => {
		// Don't redirect while still initializing or loading
		if (!authState.initialized || isLoading() || isInitializing) {
			return false;
		}

		// Redirect if not authenticated
		if (!isAuthenticated()) {
			return true;
		}

		// Redirect if email verification is required but not verified
		if (requireEmailVerification && !isEmailVerified()) {
			return true;
		}

		return false;
	});

	// Handle redirection logic
	function handleRedirect() {
		if (!shouldRedirect) return;

		// Determine redirect destination
		let redirectUrl;

		if (!isAuthenticated()) {
			// Not authenticated - redirect to login
			const currentUrl = redirectTo || $page.url.pathname + $page.url.search;
			const loginUrl = `/login?redirectTo=${encodeURIComponent(currentUrl)}`;
			redirectUrl = loginUrl;
		} else if (requireEmailVerification && !isEmailVerified()) {
			// Authenticated but email not verified - redirect to email verification
			redirectUrl = '/email-verify';
		}

		if (redirectUrl) {
			goto(redirectUrl);
		}
	}

	// Wait for global auth initialization and handle redirects
	onMount(async () => {
		// Wait for global auth initialization to complete
		let attempts = 0;
		while (!authState.initialized && attempts < 50) {
			await new Promise((resolve) => setTimeout(resolve, 100));
			attempts++;
		}

		// Add a small delay to ensure all reactive states are settled
		await new Promise((resolve) => setTimeout(resolve, 50));
		isInitializing = false;

		// Handle redirect after initialization
		handleRedirect();
	});

	// Watch for changes in authentication state and handle redirects
	// Only redirect if user becomes unauthenticated during session (logout)
	$effect(() => {
		if (authState.initialized && !isInitializing && !isLoading()) {
			// Only redirect if user was authenticated before but now is not
			// This prevents redirects during normal navigation
			if (!isAuthenticated() && authState.user === null) {
				handleRedirect();
			}
		}
	});
</script>

<!-- Show loading spinner while initializing or during auth operations -->
{#if !authState.initialized || isLoading() || isInitializing}
	<div class="flex min-h-screen items-center justify-center">
		<LoadingSpinner />
	</div>
	<!-- Show protected content if access is granted -->
{:else if hasAccess}
	{@render children()}
	<!-- Show nothing while redirecting (component will redirect) -->
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<LoadingSpinner />
	</div>
{/if}
