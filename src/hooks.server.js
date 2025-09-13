/**
 * SvelteKit server-side hooks for authentication middleware
 * Requirements: 5.1
 */

import { authMiddleware } from '$lib/auth/auth-guard.svelte.js';

/**
 * Handle server-side requests with authentication middleware
 * @param {Object} event - SvelteKit request event
 * @param {Function} resolve - SvelteKit resolve function
 * @returns {Promise<Response>} Response
 */
export async function handle({ event, resolve }) {
	// Apply authentication middleware
	return await authMiddleware({ event, resolve });
}