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

		// Initialize CSRF token on server
		await initCsrf();

		// Check if user is authenticated
		try {
			const user = await auth.get('/api/user');
			return {
				user,
				isAuthenticated: true
			};
		} catch (error) {
			// User not authenticated or error occurred
			if (error.status !== 401) {
				console.log('Authentication check failed:', error.message);
			}
		}

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
