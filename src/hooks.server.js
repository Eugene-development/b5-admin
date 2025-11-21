/**
 * SvelteKit server-side hooks for authentication middleware
 * Uses status-based permissions instead of domain-based access control
 */

import { authMiddleware } from '$lib/auth/auth-guard.svelte.js';

/**
 * Handle server-side requests with authentication middleware
 * Access control is now handled by status-based permissions in auth-guard
 * @param {Object} event - SvelteKit request event
 * @param {Function} resolve - SvelteKit resolve function
 * @returns {Promise<Response>} Response
 */
export async function handle({ event, resolve }) {
	// Apply authentication middleware with status-based permissions
	return await authMiddleware({ event, resolve });
}
