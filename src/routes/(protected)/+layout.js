/**
 * Layout load function for protected routes
 */

import { createAuthLoad } from '$lib/auth/auth-guard.svelte.js';

// Create load function that requires authentication and email verification
export const load = createAuthLoad({
	redirectTo: '/login',
	requireAuth: true,
	requireEmailVerification: true
});
