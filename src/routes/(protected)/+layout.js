/**
 * Layout load function for protected routes
 * Requirements: 3.4, 5.1
 */

import { createAuthLoad } from '$lib/auth/auth-guard.svelte.js';

// Create load function that requires authentication
export const load = createAuthLoad({
	redirectTo: '/login',
	requireAuth: true
});
