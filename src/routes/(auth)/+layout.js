/**
 * Layout load function for authentication routes (login, register)
 * Requirements: 2.5 - Redirect authenticated users away from auth pages
 */

import { createGuestLoad } from '$lib/auth/auth-guard.svelte.js';

// Create load function that requires guest status (not authenticated)
export const load = createGuestLoad({
	redirectTo: '/dashboard'
});
