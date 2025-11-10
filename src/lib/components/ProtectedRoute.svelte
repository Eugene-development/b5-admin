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
	import { hasAuthToken, getUserData } from '../api/config.js';
	import LoadingSpinner from './LoadingSpinner.svelte';

	// Props
	let { requireEmailVerification = false, redirectTo = undefined, children } = $props();

	// State to prevent flickering during initialization
	let isInitializing = $state(true);

	// Reactive state for access control with localStorage fallback
	let hasAccess = $derived(() => {
		// If auth state is initialized, use it directly
		if (authState.initialized && !isLoading()) {
			// Check authentication
			if (!isAuthenticated()) {
				return false;
			}

			// Check email verification if required
			if (requireEmailVerification && !isEmailVerified()) {
				return false;
			}

			return true;
		}

		// If auth state not ready but we're not initializing, check localStorage directly
		if (!isInitializing && !authState.initialized) {
			const hasToken = hasAuthToken();
			const storedUser = getUserData();

			if (!hasToken || !storedUser) {
				return false;
			}

			// Check email verification if required
			if (requireEmailVerification && !storedUser.email_verified) {
				return false;
			}

			return true;
		}

		// Still initializing, don't grant access yet
		return false;
	});

	// Reactive state for determining redirect behavior
	let shouldRedirect = $derived(() => {
		// Don't redirect while still initializing or loading
		if (isInitializing || (!authState.initialized && isLoading())) {
			return false;
		}

		// If auth state is ready, use it for redirect decisions
		if (authState.initialized) {
			// Redirect if not authenticated
			if (!isAuthenticated()) {
				return true;
			}

			// Redirect if email verification is required but not verified
			if (requireEmailVerification && !isEmailVerified()) {
				return true;
			}

			return false;
		}

		// Auth state not ready, check localStorage
		const hasToken = hasAuthToken();
		const storedUser = getUserData();

		// Redirect if no token or user data
		if (!hasToken || !storedUser) {
			return true;
		}

		// Redirect if email verification is required but not verified
		if (requireEmailVerification && !storedUser.email_verified) {
			return true;
		}

		return false;
	});

	// Handle redirection logic
	function handleRedirect() {
		if (!shouldRedirect) return;

		// Determine redirect destination
		let redirectUrl;

		// Check current auth state or localStorage
		const isAuthenticatedState = authState.initialized
			? isAuthenticated()
			: hasAuthToken() && getUserData();
		const isEmailVerifiedState = authState.initialized
			? isEmailVerified()
			: getUserData()?.email_verified;

		if (!isAuthenticatedState) {
			// Not authenticated - redirect to login
			const currentUrl = redirectTo || $page.url.pathname + $page.url.search;
			const loginUrl = `/login?redirectTo=${encodeURIComponent(currentUrl)}`;
			redirectUrl = loginUrl;
		} else if (requireEmailVerification && !isEmailVerifiedState) {
			// Authenticated but email not verified - redirect to email verification
			redirectUrl = '/email-verify';
		}

		if (redirectUrl) {
			goto(redirectUrl);
		}
	}

	// Wait for global auth initialization and handle redirects
	onMount(async () => {
		// Immediately stop showing initializing state to show skeleton ASAP
		isInitializing = false;

		// Wait for global auth initialization to complete in background
		let attempts = 0;
		while (!authState.initialized && attempts < 50) {
			await new Promise((resolve) => setTimeout(resolve, 100));
			attempts++;
		}

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

<!-- Show protected content immediately, let page's TableSkeleton handle loading state -->
{#if hasAccess || !authState.initialized}
	<div class="animate-fade">
		{@render children()}
	</div>
	<!-- Show nothing while redirecting (component will redirect) -->
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<!-- <LoadingSpinner /> -->
	</div>
{/if}
