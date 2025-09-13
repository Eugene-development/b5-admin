/**
 * Authentication middleware and route protection for SvelteKit
 * Requirements: 3.4, 4.3, 5.1
 */

import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { authState, getUser, clearAuthState } from './auth.svelte.js';

/**
 * Initialize authentication state on app startup
 * Now returns existing auth state instead of fetching from server
 * Server-side initialization is handled in +layout.server.js
 * Requirements: 4.1, 4.2, 4.3
 * @returns {Promise<Object|null>} User data if authenticated, null otherwise
 */
export async function initializeAuth() {
	// Auth state is now initialized from server data
	// Return current auth state without making fetch requests
	return authState.user;
}

/**
 * Check if user is authenticated
 * Requirements: 3.4, 5.1
 * @returns {boolean} True if user is authenticated
 */
export function isAuthenticated() {
	return authState.isAuthenticated;
}

/**
 * Require authentication for a route
 * Redirects to login page if user is not authenticated
 * Requirements: 3.4, 5.1
 * @param {string} redirectTo - Path to redirect unauthenticated users (default: '/login')
 * @returns {void}
 * @throws {redirect} Redirects to login page if not authenticated
 */
export function requireAuth(redirectTo = '/login') {
	if (!isAuthenticated()) {
		throw redirect(302, redirectTo);
	}
}

/**
 * Require guest access (not authenticated)
 * Redirects authenticated users to dashboard
 * Requirements: 2.5
 * @param {string} redirectTo - Path to redirect authenticated users (default: '/dashboard')
 * @returns {void}
 * @throws {redirect} Redirects to dashboard if authenticated
 */
export function requireGuest(redirectTo = '/dashboard') {
	if (isAuthenticated()) {
		throw redirect(302, redirectTo);
	}
}

/**
 * Create a load function that requires authentication
 * Factory function for creating protected route load functions
 * Requirements: 3.4, 4.3, 5.1
 * @param {Object} options - Configuration options
 * @param {string} options.redirectTo - Path to redirect unauthenticated users
 * @param {boolean} options.requireAuth - Whether authentication is required
 * @param {boolean} options.initializeOnLoad - Whether to initialize auth state
 * @returns {Function} SvelteKit load function
 */
export function createAuthLoad(options = {}) {
	const { redirectTo = '/login', requireAuth = true } = options;

	return async ({ url, route }) => {
		// Auth state is now initialized from server load function
		// No need for client-side initialization

		// Check authentication requirement
		if (requireAuth && !authState.isAuthenticated) {
			// Store the intended destination for post-login redirect
			const returnTo = url.pathname + url.search;
			const loginUrl = `${redirectTo}?returnTo=${encodeURIComponent(returnTo)}`;
			throw redirect(302, loginUrl);
		}

		// Return user data for the route
		return {
			user: authState.user,
			isAuthenticated: authState.isAuthenticated
		};
	};
}

/**
 * Create a load function that requires guest access (not authenticated)
 * Factory function for creating guest-only route load functions
 * Requirements: 2.5
 * @param {Object} options - Configuration options
 * @param {string} options.redirectTo - Path to redirect authenticated users
 * @returns {Function} SvelteKit load function
 */
export function createGuestLoad(options = {}) {
	const { redirectTo = '/dashboard' } = options;

	return async ({ url }) => {
		// Auth state is now initialized from server load function
		// No need for client-side initialization

		// Redirect authenticated users
		if (authState.isAuthenticated) {
			throw redirect(302, redirectTo);
		}

		return {
			user: null,
			isAuthenticated: false
		};
	};
}

/**
 * Authentication middleware for server-side hooks
 * Can be used in hooks.server.js for server-side authentication checks
 * Requirements: 5.1
 * @param {Object} event - SvelteKit request event
 * @param {Function} resolve - SvelteKit resolve function
 * @returns {Promise<Response>} Response from resolve or redirect
 */
export async function authMiddleware({ event, resolve }) {
	const { url, route } = event;

	// Define protected route patterns
	const protectedRoutes = ['/dashboard', '/profile', '/settings'];

	// Define guest-only routes (redirect authenticated users)
	const guestRoutes = ['/login', '/register'];

	const isProtectedRoute = protectedRoutes.some((route) => url.pathname.startsWith(route));

	const isGuestRoute = guestRoutes.some((route) => url.pathname.startsWith(route));

	// For protected routes, we'll let the client-side handle authentication
	// since we're using SPA authentication with cookies
	if (isProtectedRoute || isGuestRoute) {
		// Add authentication headers for API requests
		event.locals.requiresAuth = isProtectedRoute;
		event.locals.requiresGuest = isGuestRoute;
	}

	return await resolve(event);
}

/**
 * Client-side navigation guard
 * Checks authentication before navigation to protected routes
 * Requirements: 3.4, 4.3, 5.1
 * @param {string} pathname - Target pathname
 * @param {Object} options - Navigation options
 * @returns {Promise<boolean>} True if navigation is allowed
 */
export async function navigationGuard(pathname, options = {}) {
	const { requireAuth = false, requireGuest = false } = options;

	// Auth state is now initialized from server load function
	// No need for client-side initialization

	// Check authentication requirements
	if (requireAuth && !authState.isAuthenticated) {
		return false;
	}

	if (requireGuest && authState.isAuthenticated) {
		return false;
	}

	return true;
}

/**
 * Utility function to check if a route requires authentication
 * @param {string} pathname - Route pathname
 * @returns {boolean} True if route requires authentication
 */
export function isProtectedRoute(pathname) {
	const protectedPatterns = ['/dashboard', '/profile', '/settings', '/admin'];

	return protectedPatterns.some((pattern) => pathname.startsWith(pattern));
}

/**
 * Utility function to check if a route is guest-only
 * @param {string} pathname - Route pathname
 * @returns {boolean} True if route is guest-only
 */
export function isGuestRoute(pathname) {
	const guestPatterns = ['/login', '/register', '/forgot-password'];

	return guestPatterns.some((pattern) => pathname.startsWith(pattern));
}

/**
 * Handle post-login redirect
 * Redirects user to intended destination or default location after login
 * Requirements: 2.3
 * @param {URLSearchParams} searchParams - URL search parameters
 * @param {string} defaultRedirect - Default redirect path
 * @returns {string} Redirect path
 */
export function getPostLoginRedirect(searchParams, defaultRedirect = '/dashboard') {
	const returnTo = searchParams.get('returnTo');

	// Validate returnTo parameter to prevent open redirect attacks
	if (returnTo) {
		try {
			const url = new URL(returnTo, window.location.origin);
			// Only allow same-origin redirects
			if (url.origin === window.location.origin) {
				return url.pathname + url.search;
			}
		} catch (error) {
			console.warn('Invalid returnTo parameter:', returnTo);
		}
	}

	return defaultRedirect;
}

/**
 * Store current location for post-login redirect
 * Stores the current URL in session storage for later retrieval
 * @param {string} currentPath - Current pathname and search
 */
export function storeReturnPath(currentPath) {
	if (browser) {
		try {
			sessionStorage.setItem('auth_return_path', currentPath);
		} catch (error) {
			console.debug('Failed to store return path:', error);
		}
	}
}

/**
 * Get and clear stored return path
 * Retrieves and removes the stored return path from session storage
 * @returns {string|null} Stored return path or null
 */
export function getAndClearReturnPath() {
	if (browser) {
		try {
			const returnPath = sessionStorage.getItem('auth_return_path');
			if (returnPath) {
				sessionStorage.removeItem('auth_return_path');
				return returnPath;
			}
		} catch (error) {
			console.debug('Failed to get return path:', error);
		}
	}
	return null;
}
