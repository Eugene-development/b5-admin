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
	let { 
		requireEmailVerification = false, 
		redirectTo = undefined,
		children 
	} = $props();

	// Reactive state for access control
	let hasAccess = $derived(() => {
		// If still loading or not initialized, don't grant access yet
		if (!authState.initialized || isLoading()) {
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
		if (!authState.initialized || isLoading()) {
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

	// Initialize authentication and handle redirects
	onMount(async () => {
		// Initialize auth state if not already done
		if (!authState.initialized) {
			await initializeAuth();
		}

		// Handle redirect after initialization
		handleRedirect();
	});

	// Watch for changes in authentication state and handle redirects
	$effect(() => {
		if (authState.initialized) {
			handleRedirect();
		}
	});
</script>

<!-- Show loading spinner while initializing or during auth operations -->
{#if !authState.initialized || isLoading()}
	<div class="flex items-center justify-center min-h-screen">
		<LoadingSpinner />
	</div>
<!-- Show protected content if access is granted -->
{:else if hasAccess}
	{@render children()}
<!-- Show nothing while redirecting (component will redirect) -->
{:else}
	<div class="flex items-center justify-center min-h-screen">
		<LoadingSpinner />
	</div>
{/if}