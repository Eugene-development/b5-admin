/**
 * Login page load function
 * Handles server-side logic for the login page
 */

export async function load({ url }) {
	// Get the redirectTo parameter from URL search params
	const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
	
	return {
		redirectTo
	};
}