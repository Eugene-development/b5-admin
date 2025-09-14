/**
 * Layout load function for protected routes
 */

import { createAuthLoad } from '$lib/auth/auth-guard.svelte.js';

// Create load function that requires authentication
export const load = createAuthLoad({
	redirectTo: '/login',
	requireAuth: true
});
