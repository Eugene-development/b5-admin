/**
 * SvelteKit client-side hooks for authentication handling
 * Requirements: 4.1, 4.2, 4.3, 5.1
 */

import { browser } from '$app/environment';
import { isProtectedRoute, isGuestRoute } from '$lib/auth/auth-guard.svelte.js';

/**
 * Handle client-side navigation and authentication state
 */
export async function handleError({ error, event }) {
	console.error('Client error:', error);

	// Handle authentication errors
	if (error.status === 401) {
		// Clear auth state and redirect to login using safe redirect
		const { clearAuthState, safeRedirectToLogin } = await import('$lib/auth/auth.svelte.js');
		clearAuthState();

		// Use safe redirect to prevent multiple concurrent redirects
		await safeRedirectToLogin(event.url.pathname);
	}

	return {
		message: error.message || 'An unexpected error occurred'
	};
}

/**
 * Handle client-side navigation with authentication checks
 */
export async function beforeNavigate({ from, to, cancel }) {
	// Skip navigation checks for external URLs or same page
	if (!to || !to.url || to.url.origin !== location.origin) {
		return;
	}

	const pathname = to.url.pathname;

	// Check if navigation to protected route is allowed
	if (isProtectedRoute(pathname)) {
		const { navigationGuard } = await import('$lib/auth/auth-guard.svelte.js');
		const allowed = await navigationGuard(pathname, { requireAuth: true });

		if (!allowed) {
			cancel();
			const { safeRedirectToLogin } = await import('$lib/auth/auth.svelte.js');
			await safeRedirectToLogin(pathname + to.url.search);
		}
	}

	// Check if navigation to guest-only route is allowed
	if (isGuestRoute(pathname)) {
		const { navigationGuard } = await import('$lib/auth/auth-guard.svelte.js');
		const allowed = await navigationGuard(pathname, { requireGuest: true });

		if (!allowed) {
			cancel();
			const { goto } = await import('$app/navigation');
			await goto('/dashboard');
		}
	}
}

/**
 * Handle client-side errors with authentication context
 */
export async function handleClientError({ error, event }) {
	return handleError({ error, event });
}
