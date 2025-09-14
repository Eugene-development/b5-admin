/**
 * Layout server load function
 * Handles authentication checks and CSRF initialization on the server
 */

import { createApiClients } from '$lib/utils/http-client.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch }) {
	try {
		// Create API clients with SvelteKit fetch
		const { auth, initCsrf } = createApiClients(fetch);

		// Skip server-side auth checks to prevent session creation
		// Authentication will be handled client-side
		console.log('🔧 Skipping server-side auth checks to prevent session creation');

		return {
			user: null,
			isAuthenticated: false
		};
	} catch (error) {
		console.error('Failed to initialize CSRF or check authentication:', error);
		return {
			user: null,
			isAuthenticated: false
		};
	}
}
